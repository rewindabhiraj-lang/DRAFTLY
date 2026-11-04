import React from 'react';

interface LegalPageProps {
  navigate: (path: string) => void;
}

export const TermsPage: React.FC<LegalPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-xs sm:text-sm text-[#A59BB8] leading-relaxed space-y-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope'] mb-4">
        Terms & Conditions
      </h1>
      <p className="text-[#BB86FF]">Effective Date: November 2026</p>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing or using DRAFTLY ("the Platform"), whether as a Client, Video Editor, or Visitor, you agree to be bound by these Terms & Conditions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">2. Editor Approval & Representations</h2>
        <p>
          All video editors represent that all samples, showreels, and portfolio materials uploaded or linked are original works created by the editor or explicitly attribute their role. Unapproved, fraudulent, or plagiarized submissions will result in immediate profile termination.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">3. Intellectual Property & Deliverables</h2>
        <p>
          Upon client milestone approval and full payment for a project, the client receives exclusive worldwide rights to the finalized exported video files, subject to the editor's right to showcase non-confidential excerpts for portfolio purposes unless an NDA was agreed upon.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">4. Revisions & Approvals</h2>
        <p>
          Standard proposals include up to two rounds of minor revisions within the agreed scope. Radical script changes or additions beyond initial brief may incur supplementary milestone proposals.
        </p>
      </section>
    </div>
  );
};

export const PrivacyPage: React.FC<LegalPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-xs sm:text-sm text-[#A59BB8] leading-relaxed space-y-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope'] mb-4">
        Privacy Policy
      </h1>
      <p className="text-[#BB86FF]">Effective Date: November 2026</p>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
        <p>
          We collect registration details (name, email address, profile picture), editor professional qualifications (experience, showreels, skill categories), communication records exchanged between clients and editors, and project proposal parameters.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">2. How We Protect Your Data</h2>
        <p>
          DRAFTLY enforces strict Cloud Firestore security rules. Client and editor communications are restricted exclusively to participating project members. Passwords and sensitive authentication tokens are managed securely through Firebase Authentication and are never stored in plaintext.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">3. Third-Party Media Storage</h2>
        <p>
          We do not store large binary raw video archives on our database servers. Users share external streaming links (YouTube, Vimeo, Google Drive) with access control maintained on those respective host providers.
        </p>
      </section>
    </div>
  );
};
