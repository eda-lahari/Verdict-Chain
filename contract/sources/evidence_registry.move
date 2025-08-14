// VerdictChain - Complete Evidence Management Smart Contract
// All modules in one file

module VerdictChain::EvidenceRegister {
    use aptos_framework::signer;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use std::string::String;
    use std::vector;
    
    struct Evidence has store, key {
        evidence_hash: String,
        case_id: String,
        upload_timestamp: u64,
        uploader: address,
        metadata: String,
        file_size: u64,
        file_type: String,
    }
    
    struct EvidenceRegistry has key {
        evidence_count: u64,
        case_evidence: vector<address>,
    }
    
    #[event]
    struct EvidenceRegisteredEvent has drop, store {
        case_id: String,
        evidence_hash: String,
        timestamp: u64,
        uploader: address,
        evidence_id: u64,
    }
    
    public fun initialize_registry(admin: &signer) {
        let registry = EvidenceRegistry {
            evidence_count: 0,
            case_evidence: vector::empty<address>(),
        };
        move_to(admin, registry);
    }
    
    public fun register_evidence(
        uploader: &signer, 
        case_id: String, 
        evidence_hash: String,
        metadata: String,
        file_size: u64,
        file_type: String
    ) acquires EvidenceRegistry {
        let uploader_addr = signer::address_of(uploader);
        let current_time = timestamp::now_seconds();
        
        let registry = borrow_global_mut<EvidenceRegistry>(@VerdictChain);
        registry.evidence_count = registry.evidence_count + 1;
        vector::push_back(&mut registry.case_evidence, uploader_addr);
        
        let evidence = Evidence {
            evidence_hash,
            case_id,
            upload_timestamp: current_time,
            uploader: uploader_addr,
            metadata,
            file_size,
            file_type,
        };
        
        move_to(uploader, evidence);
        
        event::emit(EvidenceRegisteredEvent {
            case_id,
            evidence_hash,
            timestamp: current_time,
            uploader: uploader_addr,
            evidence_id: registry.evidence_count,
        });
    }
    
    public fun get_evidence(evidence_owner: address): (String, String, u64, String, u64, String) acquires Evidence {
        let evidence = borrow_global<Evidence>(evidence_owner);
        (
            evidence.evidence_hash, 
            evidence.case_id, 
            evidence.upload_timestamp, 
            evidence.metadata,
            evidence.file_size,
            evidence.file_type
        )
    }
    
    public fun verify_evidence_hash(evidence_owner: address, provided_hash: String): bool acquires Evidence {
        if (!exists<Evidence>(evidence_owner)) {
            return false
        };
        
        let evidence = borrow_global<Evidence>(evidence_owner);
        evidence.evidence_hash == provided_hash
    }
    
    public fun get_evidence_count(): u64 acquires EvidenceRegistry {
        let registry = borrow_global<EvidenceRegistry>(@VerdictChain);
        registry.evidence_count
    }
}

module VerdictChain::EvidenceVerification {
    use aptos_framework::signer;
    use aptos_framework::timestamp;
    use std::string::String;
    use std::vector;
    
    struct CaseVerification has store, key {
        case_id: String,
        approval_threshold: u64,
        current_approvals: u64,
        approvers: vector<address>,
        is_verified: bool,
        admin: address,
        creation_timestamp: u64,
        verification_deadline: u64,
    }
    
    #[event]
    struct CaseVerificationInitialized has drop, store {
        case_id: String,
        admin: address,
        threshold: u64,
        deadline: u64,
    }
    
    #[event]
    struct ApprovalSubmitted has drop, store {
        case_id: String,
        approver: address,
        timestamp: u64,
        total_approvals: u64,
    }
    
    #[event]
    struct CaseVerified has drop, store {
        case_id: String,
        verification_timestamp: u64,
        final_approver: address,
    }
    
    public fun initialize_case_verification(
        admin: &signer,
        case_id: String,
        approval_threshold: u64,
        deadline_hours: u64
    ) {
        let admin_addr = signer::address_of(admin);
        let current_time = timestamp::now_seconds();
        let deadline = current_time + (deadline_hours * 3600);
        
        let case_verification = CaseVerification {
            case_id,
            approval_threshold,
            current_approvals: 0,
            approvers: vector::empty<address>(),
            is_verified: false,
            admin: admin_addr,
            creation_timestamp: current_time,
            verification_deadline: deadline,
        };
        
        move_to(admin, case_verification);
        
        event::emit(CaseVerificationInitialized {
            case_id,
            admin: admin_addr,
            threshold: approval_threshold,
            deadline,
        });
    }
    
    public fun submit_approval(
        witness: &signer,
        case_owner: address
    ) acquires CaseVerification {
        let witness_addr = signer::address_of(witness);
        let case_verification = borrow_global_mut<CaseVerification>(case_owner);
        let current_time = timestamp::now_seconds();
        
        assert!(current_time <= case_verification.verification_deadline, 1);
        assert!(!case_verification.is_verified, 2);
        assert!(!vector::contains(&case_verification.approvers, &witness_addr), 3);
        
        vector::push_back(&mut case_verification.approvers, witness_addr);
        case_verification.current_approvals = case_verification.current_approvals + 1;
        
        event::emit(ApprovalSubmitted {
            case_id: case_verification.case_id,
            approver: witness_addr,
            timestamp: current_time,
            total_approvals: case_verification.current_approvals,
        });
        
        if (case_verification.current_approvals >= case_verification.approval_threshold) {
            case_verification.is_verified = true;
            
            event::emit(CaseVerified {
                case_id: case_verification.case_id,
                verification_timestamp: current_time,
                final_approver: witness_addr,
            });
        };
    }
    
    public fun get_verification_status(case_owner: address): (bool, u64, u64, u64) acquires CaseVerification {
        let case_verification = borrow_global<CaseVerification>(case_owner);
        (
            case_verification.is_verified,
            case_verification.current_approvals,
            case_verification.approval_threshold,
            case_verification.verification_deadline
        )
    }
    
    public fun is_case_verified(case_owner: address): bool acquires CaseVerification {
        let case_verification = borrow_global<CaseVerification>(case_owner);
        case_verification.is_verified
    }
    
    public fun get_approvers(case_owner: address): vector<address> acquires CaseVerification {
        let case_verification = borrow_global<CaseVerification>(case_owner);
        case_verification.approvers
    }
}

module VerdictChain::MultiSignatureApproval {
    use aptos_framework::signer;
    use aptos_framework::timestamp;
    use std::string::{Self, String};
    use std::vector;
    
    struct MultiSigApproval has store, key {
        case_id: String,
        evidence_hash: String,
        required_signatures: u64,
        current_signatures: u64,
        signers: vector<address>,
        is_approved: bool,
        creation_timestamp: u64,
        approval_deadline: u64,
        admin: address,
    }
    
    struct MultiSigRegistry has key {
        total_multisigs: u64,
        active_multisigs: vector<address>,
    }
    
    #[event]
    struct MultiSigInitialized has drop, store {
        case_id: String,
        evidence_hash: String,
        required_signatures: u64,
        admin: address,
        deadline: u64,
    }
    
    #[event]
    struct SignatureAdded has drop, store {
        case_id: String,
        signer: address,
        timestamp: u64,
        total_signatures: u64,
    }
    
    #[event]
    struct MultiSigApproved has drop, store {
        case_id: String,
        evidence_hash: String,
        approval_timestamp: u64,
        final_signer: address,
    }
    
    public fun initialize_registry(admin: &signer) {
        let registry = MultiSigRegistry {
            total_multisigs: 0,
            active_multisigs: vector::empty<address>(),
        };
        move_to(admin, registry);
    }
    
    public fun initialize_multisig(
        admin: &signer,
        case_id: String,
        evidence_hash: String,
        required_signatures: u64,
        deadline_hours: u64
    ) acquires MultiSigRegistry {
        let admin_addr = signer::address_of(admin);
        let current_time = timestamp::now_seconds();
        let deadline = current_time + (deadline_hours * 3600);
        
        let registry = borrow_global_mut<MultiSigRegistry>(@VerdictChain);
        registry.total_multisigs = registry.total_multisigs + 1;
        vector::push_back(&mut registry.active_multisigs, admin_addr);
        
        let multisig_approval = MultiSigApproval {
            case_id,
            evidence_hash,
            required_signatures,
            current_signatures: 0,
            signers: vector::empty<address>(),
            is_approved: false,
            creation_timestamp: current_time,
            approval_deadline: deadline,
            admin: admin_addr,
        };
        
        move_to(admin, multisig_approval);
        
        event::emit(MultiSigInitialized {
            case_id,
            evidence_hash,
            required_signatures,
            admin: admin_addr,
            deadline,
        });
    }
    
    public fun add_signature(
        signer_account: &signer,
        multisig_owner: address,
        provided_evidence_hash: String
    ) acquires MultiSigApproval {
        let signer_addr = signer::address_of(signer_account);
        let multisig = borrow_global_mut<MultiSigApproval>(multisig_owner);
        let current_time = timestamp::now_seconds();
        
        assert!(current_time <= multisig.approval_deadline, 1);
        assert!(!multisig.is_approved, 2);
        assert!(string::bytes(&multisig.evidence_hash) == string::bytes(&provided_evidence_hash), 3);
        assert!(!vector::contains(&multisig.signers, &signer_addr), 4);
        
        vector::push_back(&mut multisig.signers, signer_addr);
        multisig.current_signatures = multisig.current_signatures + 1;
        
        event::emit(SignatureAdded {
            case_id: multisig.case_id,
            signer: signer_addr,
            timestamp: current_time,
            total_signatures: multisig.current_signatures,
        });
        
        if (multisig.current_signatures >= multisig.required_signatures) {
            multisig.is_approved = true;
            
            event::emit(MultiSigApproved {
                case_id: multisig.case_id,
                evidence_hash: multisig.evidence_hash,
                approval_timestamp: current_time,
                final_signer: signer_addr,
            });
        };
    }
    
    public fun get_multisig_status(multisig_owner: address): (bool, u64, u64, u64) acquires MultiSigApproval {
        let multisig = borrow_global<MultiSigApproval>(multisig_owner);
        (
            multisig.is_approved,
            multisig.current_signatures,
            multisig.required_signatures,
            multisig.approval_deadline
        )
    }
    
    public fun is_approved(multisig_owner: address): bool acquires MultiSigApproval {
        let multisig = borrow_global<MultiSigApproval>(multisig_owner);
        multisig.is_approved
    }
    
    public fun get_signers(multisig_owner: address): vector<address> acquires MultiSigApproval {
        let multisig = borrow_global<MultiSigApproval>(multisig_owner);
        multisig.signers
    }
}

module VerdictChain::NFTCertificate {
    use aptos_framework::signer;
    use aptos_framework::timestamp;
    use std::string::String;
    use std::vector;
    
    struct EvidenceCertificate has store, key {
        case_id: String,
        evidence_hash: String,
        verification_timestamp: u64,
        certificate_id: u64,
        issuing_authority: address,
        is_authentic: bool,
        certificate_metadata: String,
        expiry_timestamp: u64,
    }
    
    struct CertificateRegistry has key {
        counter: u64,
        total_certificates: u64,
        certificate_owners: vector<address>,
        authorized_authorities: vector<address>,
    }
    
    #[event]
    struct CertificateMinted has drop, store {
        certificate_id: u64,
        case_id: String,
        evidence_hash: String,
        issuing_authority: address,
        timestamp: u64,
    }
    
    #[event]
    struct AuthorityUpdated has drop, store {
        authority: address,
        added: bool,
        timestamp: u64,
    }
    
    public fun initialize_registry(admin: &signer) {
        let registry = CertificateRegistry {
            counter: 0,
            total_certificates: 0,
            certificate_owners: vector::empty<address>(),
            authorized_authorities: vector::empty<address>(),
        };
        move_to(admin, registry);
    }
    
    public fun add_authority(admin: &signer, new_authority: address) acquires CertificateRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @VerdictChain, 1);
        
        let registry = borrow_global_mut<CertificateRegistry>(@VerdictChain);
        assert!(!vector::contains(&registry.authorized_authorities, &new_authority), 2);
        
        vector::push_back(&mut registry.authorized_authorities, new_authority);
        
        event::emit(AuthorityUpdated {
            authority: new_authority,
            added: true,
            timestamp: timestamp::now_seconds(),
        });
    }
    
    public fun remove_authority(admin: &signer, authority_to_remove: address) acquires CertificateRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @VerdictChain, 1);
        
        let registry = borrow_global_mut<CertificateRegistry>(@VerdictChain);
        
        let (found, index) = vector::index_of(&registry.authorized_authorities, &authority_to_remove);
        assert!(found, 3);
        vector::remove(&mut registry.authorized_authorities, index);
        
        event::emit(AuthorityUpdated {
            authority: authority_to_remove,
            added: false,
            timestamp: timestamp::now_seconds(),
        });
    }
    
    public fun is_authorized_authority(authority: address): bool acquires CertificateRegistry {
        let registry = borrow_global<CertificateRegistry>(@VerdictChain);
        vector::contains(&registry.authorized_authorities, &authority) || authority == @VerdictChain
    }
    
    public fun mint_certificate(
        authority: &signer,
        case_id: String,
        evidence_hash: String,
        certificate_metadata: String,
        validity_days: u64
    ) acquires CertificateRegistry {
        let authority_addr = signer::address_of(authority);
        let current_time = timestamp::now_seconds();
        
        assert!(is_authorized_authority(authority_addr), 1);
        
        let registry = borrow_global_mut<CertificateRegistry>(@VerdictChain);
        registry.counter = registry.counter + 1;
        registry.total_certificates = registry.total_certificates + 1;
        
        let expiry_time = current_time + (validity_days * 24 * 3600);
        
        let certificate = EvidenceCertificate {
            case_id,
            evidence_hash,
            verification_timestamp: current_time,
            certificate_id: registry.counter,
            issuing_authority: authority_addr,
            is_authentic: true,
            certificate_metadata,
            expiry_timestamp: expiry_time,
        };
        
        move_to(authority, certificate);
        
        event::emit(CertificateMinted {
            certificate_id: registry.counter,
            case_id,
            evidence_hash,
            issuing_authority: authority_addr,
            timestamp: current_time,
        });
    }
    
    public fun get_certificate(cert_owner: address): (String, String, u64, u64, bool, String, u64) acquires EvidenceCertificate {
        let cert = borrow_global<EvidenceCertificate>(cert_owner);
        (
            cert.case_id, 
            cert.evidence_hash, 
            cert.verification_timestamp, 
            cert.certificate_id, 
            cert.is_authentic,
            cert.certificate_metadata,
            cert.expiry_timestamp
        )
    }
    
    public fun verify_certificate(cert_owner: address): bool acquires EvidenceCertificate {
        if (!exists<EvidenceCertificate>(cert_owner)) {
            return false
        };
        
        let cert = borrow_global<EvidenceCertificate>(cert_owner);
        let current_time = timestamp::now_seconds();
        
        cert.is_authentic && current_time <= cert.expiry_timestamp
    }
    
    public fun get_certificate_count(): u64 acquires CertificateRegistry {
        let registry = borrow_global<CertificateRegistry>(@VerdictChain);
        registry.total_certificates
    }
    
    public fun revoke_certificate(
        authority: &signer,
        cert_owner: address
    ) acquires EvidenceCertificate, CertificateRegistry {
        let authority_addr = signer::address_of(authority);
        let cert = borrow_global_mut<EvidenceCertificate>(cert_owner);
        
        assert!(
            authority_addr == cert.issuing_authority || 
            authority_addr == @VerdictChain || 
            is_authorized_authority(authority_addr), 
            1
        );
        
        cert.is_authentic = false;
    }
}