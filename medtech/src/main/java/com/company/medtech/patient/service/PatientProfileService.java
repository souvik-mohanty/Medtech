package com.company.medtech.patient.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.patient.dto.AddressRequest;
import com.company.medtech.patient.dto.AddressResponse;
import com.company.medtech.patient.dto.FamilyMemberRequest;
import com.company.medtech.patient.dto.FamilyMemberResponse;
import com.company.medtech.patient.dto.PatientProfileResponse;
import com.company.medtech.patient.dto.PatientProfileUpdateRequest;
import com.company.medtech.patient.model.FamilyMember;
import com.company.medtech.patient.model.PatientAddress;
import com.company.medtech.patient.model.PatientProfile;
import com.company.medtech.patient.repository.FamilyMemberRepository;
import com.company.medtech.patient.repository.PatientAddressRepository;
import com.company.medtech.patient.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * A fresh Google sign-in only creates the UserAuth row (see
 * GoogleOAuthService) — the patient_profile row is lazily created here on
 * first read/write, not at signup time.
 */
@Service
public class PatientProfileService {

    private final UserAuthRepository userAuthRepository;
    private final PatientProfileRepository profileRepository;
    private final PatientAddressRepository addressRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FranchiseService franchiseService;

    public PatientProfileService(
            UserAuthRepository userAuthRepository,
            PatientProfileRepository profileRepository,
            PatientAddressRepository addressRepository,
            FamilyMemberRepository familyMemberRepository,
            FranchiseService franchiseService
    ) {
        this.userAuthRepository = userAuthRepository;
        this.profileRepository = profileRepository;
        this.addressRepository = addressRepository;
        this.familyMemberRepository = familyMemberRepository;
        this.franchiseService = franchiseService;
    }

    private UserAuth getUser(String email) {
        return userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    /** Also used by LabTestBookingService — booking must not hard-fail just because the patient never opened their Profile page first. */
    public PatientProfile getOrCreateProfile(UUID userId) {
        return profileRepository.findByUserId(userId).orElseGet(() -> {
            PatientProfile profile = new PatientProfile();
            profile.setUserId(userId);
            return profileRepository.save(profile);
        });
    }

    @Transactional(readOnly = true)
    public PatientProfileResponse getProfile(String email) {
        UserAuth user = getUser(email);
        PatientProfile profile = getOrCreateProfile(user.getId());
        return toResponse(user, profile);
    }

    @Transactional
    public PatientProfileResponse updateProfile(String email, PatientProfileUpdateRequest request) {
        UserAuth user = getUser(email);
        PatientProfile profile = getOrCreateProfile(user.getId());

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
            userAuthRepository.save(user);
        }
        if (request.getPhone() != null) {
            profile.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            profile.setContactEmail(request.getEmail());
        }
        if (request.getGender() != null) {
            profile.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }
        profileRepository.save(profile);

        return toResponse(user, profile);
    }

    @Transactional
    public PatientProfileResponse addAddress(String email, AddressRequest request) {
        franchiseService.assertPincodeServiceable(request.getPincode());

        UserAuth user = getUser(email);
        PatientProfile profile = getOrCreateProfile(user.getId());

        if (request.isDefault()) {
            addressRepository.findByPatientProfileId(profile.getId())
                    .forEach(existing -> {
                        if (existing.isDefault()) {
                            existing.setDefault(false);
                            addressRepository.save(existing);
                        }
                    });
        }

        PatientAddress address = new PatientAddress();
        address.setPatientProfileId(profile.getId());
        address.setLabel(request.getLabel());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setDefault(request.isDefault());
        addressRepository.save(address);

        return toResponse(user, profile);
    }

    @Transactional
    public PatientProfileResponse addFamilyMember(String email, FamilyMemberRequest request) {
        UserAuth user = getUser(email);
        PatientProfile profile = getOrCreateProfile(user.getId());

        FamilyMember member = new FamilyMember();
        member.setPatientProfileId(profile.getId());
        applyFamilyMemberFields(member, request);
        familyMemberRepository.save(member);

        return toResponse(user, profile);
    }

    @Transactional
    public PatientProfileResponse updateFamilyMember(String email, UUID familyMemberId, FamilyMemberRequest request) {
        UserAuth user = getUser(email);
        PatientProfile profile = getOrCreateProfile(user.getId());

        FamilyMember member = familyMemberRepository.findByIdAndPatientProfileId(familyMemberId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("FamilyMember", "id", familyMemberId.toString()));
        applyFamilyMemberFields(member, request);
        familyMemberRepository.save(member);

        return toResponse(user, profile);
    }

    @Transactional
    public PatientProfileResponse deleteFamilyMember(String email, UUID familyMemberId) {
        UserAuth user = getUser(email);
        PatientProfile profile = getOrCreateProfile(user.getId());

        FamilyMember member = familyMemberRepository.findByIdAndPatientProfileId(familyMemberId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("FamilyMember", "id", familyMemberId.toString()));
        familyMemberRepository.delete(member);

        return toResponse(user, profile);
    }

    private void applyFamilyMemberFields(FamilyMember member, FamilyMemberRequest request) {
        member.setFullName(request.getFullName());
        member.setRelation(request.getRelation());
        member.setGender(request.getGender());
        member.setDateOfBirth(request.getDateOfBirth());
    }

    private PatientProfileResponse toResponse(UserAuth user, PatientProfile profile) {
        List<AddressResponse> addresses = addressRepository.findByPatientProfileId(profile.getId()).stream()
                .map(a -> new AddressResponse(
                        a.getId().toString(), a.getLabel(), a.getLine1(), a.getLine2(),
                        a.getCity(), a.getState(), a.getPincode(), a.isDefault()))
                .toList();

        List<FamilyMemberResponse> familyMembers = familyMemberRepository.findByPatientProfileId(profile.getId()).stream()
                .map(m -> new FamilyMemberResponse(
                        m.getId().toString(), m.getFullName(), m.getRelation(), m.getGender(), m.getDateOfBirth()))
                .toList();

        return new PatientProfileResponse(
                user.getId().toString(),
                user.getFullName(),
                profile.getPhone(),
                profile.getContactEmail() != null ? profile.getContactEmail() : user.getEmail(),
                profile.getGender(),
                profile.getDateOfBirth(),
                addresses,
                familyMembers,
                profile.getCreatedAt()
        );
    }
}
