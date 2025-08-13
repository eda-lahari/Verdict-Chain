module VerdictChain::EvidenceVerification {
    use aptos_framework::signer;
    use std::string::String;
    use std::vector;
    
    /// Struct representing a case verification process
    struct CaseVerification has store, key {
        case_id: String,
        approval_threshold: u64,    // Required number of approvals
        current_approvals: u64,     // Current approval count
        approvers: vector<address>, // List of addresses who approved
        is_verified: bool,          // Whether case is verified
        admin: address,             // Court authority admin
    }
    
    /// Initialize case verification with approval threshold
    public fun initialize_case_verification(
        admin: &signer,
        case_id: String,
        approval_threshold: u64
    ) {
        let admin_addr = signer::address_of(admin);
        
        let case_verification = CaseVerification {
            case_id,
            approval_threshold,
            current_approvals: 0,
            approvers: vector::empty<address>(),
            is_verified: false,
            admin: admin_addr,
        };
        
        move_to(admin, case_verification);
    }
    
    /// Submit approval for a case (by witnesses/approvers)
    public fun submit_approval(
        witness: &signer,
        case_owner: address
    ) acquires CaseVerification {
        let witness_addr = signer::address_of(witness);
        let case_verification = borrow_global_mut<CaseVerification>(case_owner);
        
        // Check if witness already approved
        assert!(!vector::contains(&case_verification.approvers, &witness_addr), 1);
        
        // Add witness to approvers list
        vector::push_back(&mut case_verification.approvers, witness_addr);
        case_verification.current_approvals = case_verification.current_approvals + 1;
        
        // Check if threshold is reached
        if (case_verification.current_approvals >= case_verification.approval_threshold) {
            case_verification.is_verified = true;
        };
    }
    
    /// Get verification status
    public fun is_case_verified(case_owner: address): bool acquires CaseVerification {
        let case_verification = borrow_global<CaseVerification>(case_owner);
        case_verification.is_verified
    }
}