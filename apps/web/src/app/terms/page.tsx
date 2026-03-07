export const metadata = {
  title: "Terms of Service | GyoanMaker",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Terms of Service</h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Article 1 (Purpose)</h2>
          <p>
            These terms establish the conditions and procedures for using
            GyoanMaker (hereinafter &quot;the Service&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Article 2 (Service Scope)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>AI-powered English handout generation</li>
            <li>Inline editing of generated handouts</li>
            <li>Printable PDF export</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Article 3 (Eligibility)
          </h2>
          <p>
            The Service is available only to users who have signed in with a
            Google account and received administrator approval.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Article 4 (Usage Restrictions)
          </h2>
          <p>Users must not engage in the following activities.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Commercial resale of handouts generated through the Service</li>
            <li>Mass requests using automated tools</li>
            <li>Actions that disrupt normal service operation</li>
            <li>Unauthorized use of other users&apos; accounts</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Article 5 (Copyright)
          </h2>
          <p>
            Copyright of AI-generated handouts belongs to the user who generated
            them. However, the Service may use anonymized generation data for
            service improvement purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Article 6 (Disclaimer)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              The accuracy and completeness of AI-generated results are not
              guaranteed. Users should review generated handouts before use.
            </li>
            <li>
              The Service is not responsible for data loss during use. Please
              save important handouts separately.
            </li>
            <li>
              The Service is not responsible for service interruptions caused by
              external services (Google, Vercel, GCP).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Article 7 (Service Changes and Suspension)
          </h2>
          <p>
            The Service may modify or suspend its content after prior notice. In
            urgent cases, notice may be given after the fact.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Article 8 (Terms Changes)
          </h2>
          <p>
            Changes to these terms will be announced within the Service at least
            7 days before taking effect. Users who do not agree with the changed
            terms may discontinue use of the Service.
          </p>
          <p className="mt-4 text-sm text-gray-500">Effective date: March 6, 2026</p>
        </section>
      </div>
    </div>
  );
}
