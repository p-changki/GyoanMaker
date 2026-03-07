export const metadata = {
  title: "Privacy Policy | GyoanMaker",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Privacy Policy
      </h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            1. Personal Information Collected
          </h2>
          <p>The service collects the following information through Google OAuth sign-in.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Google account name</li>
            <li>Email address</li>
            <li>Profile photo URL</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Purpose of Collection</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>User identification and authentication</li>
            <li>Access control management (admin approval system)</li>
            <li>Service usage statistics (anonymized)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Retention Period</h2>
          <p>
            Collected personal information is deleted promptly upon account
            deletion request. If retention is required by applicable law, the
            data is stored separately for the required period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            4. Disclosure to Third Parties
          </h2>
          <p>
            Collected personal information is not shared with third parties,
            except when required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Processors</h2>
          <table className="w-full border-collapse border border-gray-200 text-sm mt-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                  Processor
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-4 py-2">
                  Vercel Inc.
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  Web application hosting
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-4 py-2">
                  Google Cloud Platform
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  AI API processing and data storage (Firestore)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            6. User Rights
          </h2>
          <p>Users may exercise the following rights at any time.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Request to view personal information</li>
            <li>Request to modify personal information</li>
            <li>Request to delete personal information (account deletion)</li>
          </ul>
          <p className="mt-2">
            These requests can be submitted through the service or via
            administrator email.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            7. Security Measures
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>All communications encrypted via HTTPS (TLS)</li>
            <li>Minimized access permissions (admin approval system)</li>
            <li>JWT-based session management</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Policy Changes</h2>
          <p>Changes to this policy will be announced within the service at least 7 days before taking effect.</p>
          <p className="mt-4 text-sm text-gray-500">Effective date: March 6, 2026</p>
        </section>
      </div>
    </div>
  );
}
