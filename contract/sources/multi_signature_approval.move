module VerdictChain::MultiSignatureApproval {
    use aptos_framework::signer;
    use std::string::{Self, String};
    use std::vector;
    
    /// Multi-signature approval for evidence validation
    struct MultiSigApproval has store, key {
        case_id: String,
        evidence_hash: String,      // Expected evidence hash
        required_signatures: u64,   // Required number of signatures
        current_signatures: u64,    // Current signature count
        signers: vector<address>,   // Addresses who signed
        is_approved: bool,          // Final approval status
    }
    
    /// Initialize multi-signature approval process
    public fun initialize_multisig(
        admin: &signer,
        case_id: String,
        evidence_hash: String,
        required_signatures: u64
    ) {
        let multisig_approval = MultiSigApproval {
            case_id,
            evidence_hash,
            required_signatures,
            current_signatures: 0,
            signers: vector::empty<address>(),
            is_approved: false,
        };
        
        move_to(admin, multisig_approval);
    }
    
    /// Add signature to multi-signature approval
    public fun add_signature(
        signer_account: &signer,
        multisig_owner: address,
        provided_evidence_hash: String
    ) acquires MultiSigApproval {
        let signer_addr = signer::address_of(signer_account);
        let multisig = borrow_global_mut<MultiSigApproval>(multisig_owner);
        
        // Verify evidence hash matches
        assert!(string::bytes(&multisig.evidence_hash) == string::bytes(&provided_evidence_hash), 1);
        
        // Check if signer already signed
        assert!(!vector::contains(&multisig.signers, &signer_addr), 2);
        
        // Add signature
        vector::push_back(&mut multisig.signers, signer_addr);
        multisig.current_signatures = multisig.current_signatures + 1;
        
        // Check if threshold reached
        if (multisig.current_signatures >= multisig.required_signatures) {
            multisig.is_approved = true;
        };
    }
    
    /// Get approval status
    public fun is_approved(multisig_owner: address): bool acquires MultiSigApproval {
        let multisig = borrow_global<MultiSigApproval>(multisig_owner);
        multisig.is_approved
    }
}