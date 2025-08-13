module VerdictChain::NFTCertificate {
    use aptos_framework::signer;
    use aptos_framework::timestamp;
    use std::string::String;
    
    /// NFT Certificate for verified evidence
    struct EvidenceCertificate has store, key {
        case_id: String,
        evidence_hash: String,
        verification_timestamp: u64,
        certificate_id: u64,
        issuing_authority: address,
        is_authentic: bool,
    }
    
    /// Certificate counter for unique IDs
    struct CertificateCounter has key {
        counter: u64,
    }
    
    /// Initialize certificate counter
    public fun initialize_counter(admin: &signer) {
        let counter = CertificateCounter {
            counter: 0,
        };
        move_to(admin, counter);
    }
    
    /// Mint certificate NFT for verified evidence
    public fun mint_certificate(
        authority: &signer,
        case_id: String,
        evidence_hash: String
    ) acquires CertificateCounter {
        let authority_addr = signer::address_of(authority);
        let current_time = timestamp::now_seconds();
        
        // Get and increment certificate counter
        let counter = borrow_global_mut<CertificateCounter>(@VerdictChain);
        counter.counter = counter.counter + 1;
        
        let certificate = EvidenceCertificate {
            case_id,
            evidence_hash,
            verification_timestamp: current_time,
            certificate_id: counter.counter,
            issuing_authority: authority_addr,
            is_authentic: true,
        };
        
        // Store certificate under authority's account
        move_to(authority, certificate);
    }
    
    /// Get certificate details
    public fun get_certificate(cert_owner: address): (String, String, u64, u64, bool) acquires EvidenceCertificate {
        let cert = borrow_global<EvidenceCertificate>(cert_owner);
        (cert.case_id, cert.evidence_hash, cert.verification_timestamp, cert.certificate_id, cert.is_authentic)
    }
}