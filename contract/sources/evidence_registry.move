module VerdictChain::EvidenceRegister {
    use aptos_framework::signer;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use std::string::String;
    
    /// Struct representing evidence stored on blockchain
    struct Evidence has store, key {
        evidence_hash: String,     // Hash of the evidence file
        case_id: String,          // Associated case identifier
        upload_timestamp: u64,     // When evidence was uploaded
        uploader: address,        // Who uploaded the evidence
        metadata: String,         // Safe metadata (no personal info)
    }
    
    /// Event emitted when evidence is registered
    #[event]
    struct EvidenceRegisteredEvent has drop, store {
        case_id: String,
        evidence_hash: String,
        timestamp: u64,
        uploader: address,
    }
    
    /// Register new evidence on the blockchain
    public fun register_evidence(
        uploader: &signer, 
        case_id: String, 
        evidence_hash: String,
        metadata: String
    ) {
        let uploader_addr = signer::address_of(uploader);
        let current_time = timestamp::now_seconds();
        
        // Create evidence record
        let evidence = Evidence {
            evidence_hash,
            case_id,
            upload_timestamp: current_time,
            uploader: uploader_addr,
            metadata,
        };
        
        // Store evidence under uploader's account
        move_to(uploader, evidence);
        
        // Emit event for public timeline
        event::emit(EvidenceRegisteredEvent {
            case_id,
            evidence_hash,
            timestamp: current_time,
            uploader: uploader_addr,
        });
    }
    
    /// Get evidence details
    public fun get_evidence(evidence_owner: address): (String, String, u64, String) acquires Evidence {
        let evidence = borrow_global<Evidence>(evidence_owner);
        (evidence.evidence_hash, evidence.case_id, evidence.upload_timestamp, evidence.metadata)
    }
}