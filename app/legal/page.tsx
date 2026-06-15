export const metadata = {
  title: "Terms of Service & Privacy Policy — PlateVault",
  description: "PlateVault's Terms of Service and Privacy Policy.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <h2 className="text-lg font-bold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">{title}</h2>
      <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-200 mb-2">{title}</h3>
      <div className="space-y-2 text-zinc-400">{children}</div>
    </div>
  );
}

export default function LegalPage() {
  const toc = [
    { id: "tos-general", label: "§1 General Terms" },
    { id: "tos-account", label: "§2 User Accounts" },
    { id: "tos-content", label: "§3 User Content" },
    { id: "tos-conduct", label: "§4 Acceptable Use" },
    { id: "tos-termination", label: "§5 Termination" },
    { id: "tos-changes", label: "§6 Changes to Terms" },
    { id: "tos-liability", label: "§7 Limitation of Liability" },
    { id: "tos-law", label: "§8 Governing Law" },
    { id: "privacy-data", label: "§9 Data We Collect" },
    { id: "privacy-purpose", label: "§10 Purpose & Legal Basis" },
    { id: "privacy-retention", label: "§11 Retention" },
    { id: "privacy-third", label: "§12 Third-Party Processors" },
    { id: "privacy-rights", label: "§13 Your Rights (GDPR)" },
    { id: "privacy-transfers", label: "§14 International Transfers" },
    { id: "privacy-cookies", label: "§15 Cookies & Sessions" },
    { id: "privacy-minors", label: "§16 Minors" },
    { id: "privacy-contact", label: "§17 Contact & Complaints" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">

      {/* Header */}
      <div className="mb-10 flex items-start gap-3">
        <div className="mt-1.5 h-5 w-1 rounded-full bg-indigo-500 shrink-0" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">PlateVault</p>
          <h1 className="text-3xl font-bold text-zinc-50">Terms of Service &amp; Privacy Policy</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Last updated: June 2026 · These terms govern your use of PlateVault.
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            By registering an account or using PlateVault, you confirm that you have read and agreed to both the Terms of Service
            and the Privacy Policy set out below. If you do not agree, please do not use the platform.
          </p>

          {/* Tab-like pills */}
          <div className="mt-5 flex gap-2">
            <a href="#tos-general" className="rounded-full border border-indigo-800/60 bg-indigo-950/20 px-3 py-1 text-xs text-indigo-300 hover:border-indigo-600 transition-colors">
              Terms of Service ↓
            </a>
            <a href="#privacy-controller" className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 hover:border-indigo-800/60 hover:text-indigo-300 transition-colors">
              Privacy Policy ↓
            </a>
          </div>
        </div>
      </div>

      <div className="flex gap-12 items-start">

        {/* Sidebar */}
        <aside className="hidden lg:block shrink-0 w-52 sticky top-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Contents</div>
            <nav className="space-y-0.5">
              {toc.map((item, i) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-[11px] text-zinc-400 hover:text-indigo-300 py-0.5 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ═══ TERMS OF SERVICE ═══ */}
          <div className="mb-4 rounded-xl bg-indigo-950/30 border border-indigo-900/50 px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Terms of Service</span>
          </div>

          <Section id="tos-general" title="§1 General Terms">
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User") and PlateVault ("we", "us", "the platform")
              governing your access to and use of the website and all related services.
            </p>
            <p>
              By creating an account or submitting any content to PlateVault, you acknowledge that you have read, understood, and agree to be bound
              by these Terms and our <a href="#privacy-controller" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>,
              which forms an integral part of this agreement.
            </p>
            <p>
              PlateVault is a non-commercial community platform for archiving and sharing photographs of vehicle license plates.
              It is not intended for commercial use by third parties.
            </p>
          </Section>

          <Section id="tos-account" title="§2 User Accounts">
            <p>
              Registration requires a valid email address and a chosen username. You must be at least 16 years old to register.
              By registering, you confirm that the information you provide is accurate and that you will keep it up to date.
            </p>
            <p>
              You are solely responsible for all activity that occurs under your account. You must not share your credentials
              with others or allow any third party to access your account.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms, our{" "}
              <a href="/rules" className="text-indigo-400 hover:text-indigo-300">Community Rules</a>, or applicable law, with or without prior notice
              depending on the severity of the violation.
            </p>
          </Section>

          <Section id="tos-content" title="§3 User Content">
            <Sub title="3.1 Your licence to us">
              <p>
                By uploading any photo or submitting any text to PlateVault, you grant us a worldwide, royalty-free, non-exclusive,
                perpetual licence to store, display, resize, compress, and distribute that content on the platform and in connection with it
                (for example in previews, search results, or promotional material relating to the platform itself).
              </p>
              <p>
                This licence does not transfer ownership of your content. You retain your copyright.
              </p>
            </Sub>
            <Sub title="3.2 Your warranties">
              <p>
                By submitting content you confirm that: (a) you own it or hold all necessary rights to publish it;
                (b) it does not infringe any third party's copyright, privacy, or other rights;
                (c) it complies with our <a href="/rules" className="text-indigo-400 hover:text-indigo-300">Community Rules</a>.
              </p>
            </Sub>
            <Sub title="3.3 Image retention">
              <p>
                Uploaded images are stored indefinitely on our servers unless: (a) you request deletion and we approve it;
                (b) we independently decide to remove the content for any reason including rule violations, legal requirements,
                or platform maintenance. We do not guarantee deletion on demand and reserve the right to retain content
                as described in our Privacy Policy below.
              </p>
            </Sub>
            <Sub title="3.4 Our rights over content">
              <p>
                We reserve the right to remove, hide, modify the metadata of, or otherwise manage any content submitted to the platform
                at any time and for any reason, without obligation to notify the uploader.
              </p>
            </Sub>
          </Section>

          <Section id="tos-conduct" title="§4 Acceptable Use">
            <p>
              You agree not to use PlateVault in any way that: violates applicable law; infringes the rights of others;
              introduces malware or attempts to compromise the platform's security; scrapes or harvests data from the platform
              in an automated fashion without our written consent; or circumvents any access control or moderation measure.
            </p>
            <p>
              Detailed content and conduct requirements are set out in the{" "}
              <a href="/rules" className="text-indigo-400 hover:text-indigo-300">Community Rules</a>,
              which are incorporated into these Terms by reference.
            </p>
          </Section>

          <Section id="tos-termination" title="§5 Termination">
            <p>
              You may close your account at any time by contacting the administration. Account closure does not automatically
              result in deletion of your uploaded content — see §3.3 and §12 of the Privacy Policy.
            </p>
            <p>
              We may suspend or permanently terminate your access at our discretion for any violation of these Terms or the Community Rules.
              In cases of serious violations (illegal content, repeated abuse, security threats), termination may be immediate and without prior notice.
            </p>
          </Section>

          <Section id="tos-changes" title="§6 Changes to Terms">
            <p>
              We may update these Terms at any time. When we do, we will update the "Last updated" date at the top of this page.
              For significant changes, we will notify registered users via the platform's notification system.
            </p>
            <p>
              Continued use of PlateVault after changes are published constitutes your acceptance of the revised Terms.
            </p>
          </Section>

          <Section id="tos-liability" title="§7 Limitation of Liability">
            <p>
              PlateVault is provided "as is" without warranties of any kind. We do not guarantee that the platform will be
              available at all times, error-free, or fit for any particular purpose.
            </p>
            <p>
              To the fullest extent permitted by applicable law, PlateVault and its operators shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the platform,
              including but not limited to loss of data, loss of profits, or reputational harm.
            </p>
            <p>
              We are not responsible for user-submitted content. Users are solely liable for content they upload or post.
            </p>
          </Section>

          <Section id="tos-law" title="§8 Governing Law">
            <p>
              These Terms are governed by the laws of Bosnia and Herzegovina. Any disputes arising from or relating to
              these Terms or your use of PlateVault shall be subject to the jurisdiction of the competent courts of
              Bosnia and Herzegovina, unless mandatory consumer protection laws in your country of residence require otherwise.
            </p>
            <p>
              If you are a consumer resident in the EU, you may also make use of the EU's Online Dispute Resolution platform at{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                ec.europa.eu/consumers/odr
              </a>.
              We are not obligated to participate in any alternative dispute resolution procedure.
            </p>
          </Section>

          {/* ═══ PRIVACY POLICY ═══ */}
          <div className="mb-4 mt-12 rounded-xl bg-emerald-950/30 border border-emerald-900/50 px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Privacy Policy</span>
            <p className="mt-1 text-xs text-zinc-400">
              This Privacy Policy applies to all personal data processed by PlateVault and fulfils our disclosure obligations
              under the EU General Data Protection Regulation (GDPR) and the German Federal Data Protection Act (BDSG).
            </p>
          </div>

          <Section id="privacy-data" title="§9 Data We Collect">
            <Sub title="10.1 Data you provide directly">
              <p><strong className="text-zinc-200">Email address</strong> — collected at registration and stored in our database. Used for account authentication and, where applicable, notifications.</p>
              <p><strong className="text-zinc-200">Username</strong> — publicly visible display name chosen by you at registration.</p>
              <p><strong className="text-zinc-200">Password</strong> — stored as a secure hash. We cannot read your password.</p>
              <p><strong className="text-zinc-200">Uploaded images</strong> — photos you upload as spots, stored on our file hosting infrastructure.</p>
              <p><strong className="text-zinc-200">Upload metadata</strong> — plate text, vehicle make/model, location (city + country), and any other fields you fill in when submitting a spot.</p>
              <p><strong className="text-zinc-200">Comments and likes</strong> — text you write in comments and interactions you make on the platform.</p>
            </Sub>
            <Sub title="10.2 Data collected automatically">
              <p><strong className="text-zinc-200">Session token</strong> — a secure, random token stored in an httpOnly cookie on your device, used to keep you logged in. It is associated with your account in our database.</p>
              <p><strong className="text-zinc-200">Server logs</strong> — our hosting provider may automatically log IP addresses, request timestamps, and user-agent strings for security and operational purposes. We do not actively collect or store IP addresses beyond what our hosting infrastructure logs automatically.</p>
            </Sub>
          </Section>

          <Section id="privacy-purpose" title="§10 Purpose & Legal Basis">
            <p>We process your personal data only for the following purposes and on the following legal bases (GDPR Art. 6):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 pr-4 text-zinc-400 font-medium w-1/3">Purpose</th>
                    <th className="text-left py-2 pr-4 text-zinc-400 font-medium w-1/3">Data used</th>
                    <th className="text-left py-2 text-zinc-400 font-medium">Legal basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  <tr>
                    <td className="py-2 pr-4 text-zinc-300">Account creation and authentication</td>
                    <td className="py-2 pr-4 text-zinc-400">Email, password hash, session token</td>
                    <td className="py-2 text-zinc-400">Art. 6(1)(b) — performance of contract</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-zinc-300">Displaying your spots and profile</td>
                    <td className="py-2 pr-4 text-zinc-400">Username, uploads, metadata, comments</td>
                    <td className="py-2 text-zinc-400">Art. 6(1)(b) — performance of contract</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-zinc-300">Platform notifications</td>
                    <td className="py-2 pr-4 text-zinc-400">Email (if email notifications enabled)</td>
                    <td className="py-2 text-zinc-400">Art. 6(1)(f) — legitimate interest</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-zinc-300">Moderation and safety</td>
                    <td className="py-2 pr-4 text-zinc-400">All account and content data</td>
                    <td className="py-2 text-zinc-400">Art. 6(1)(f) — legitimate interest</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-zinc-300">Legal compliance</td>
                    <td className="py-2 pr-4 text-zinc-400">Any data required by law</td>
                    <td className="py-2 text-zinc-400">Art. 6(1)(c) — legal obligation</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>We do not use your data for advertising, profiling, or sale to third parties.</p>
          </Section>

          <Section id="privacy-retention" title="§11 Retention">
            <p>
              We retain your personal data for as long as your account is active and for a reasonable period thereafter to comply with
              legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <p>
              <strong className="text-zinc-200">Account data</strong> (email, username, password hash): retained for the lifetime of your account.
              Upon account deletion request, account credentials are deleted within 30 days, subject to any legal retention obligations.
            </p>
            <p>
              <strong className="text-zinc-200">Uploaded images and spot metadata</strong>: retained indefinitely as part of the community archive.
              We preserve the right to keep uploaded content even after account closure. If you wish to request removal of specific images,
              contact us at <a href="mailto:legal@platevault.app" className="text-indigo-400 hover:text-indigo-300">legal@platevault.app</a>.
              We will evaluate each request and respond within 30 days. Removal is not guaranteed for content that forms part of the
              public archive, but we will always consider requests made under GDPR Art. 17.
            </p>
            <p>
              <strong className="text-zinc-200">Session tokens</strong>: expire after 30 days of inactivity and are deleted on logout.
            </p>
            <p>
              <strong className="text-zinc-200">Server logs</strong>: retained by our infrastructure providers according to their own retention policies,
              typically 30–90 days.
            </p>
          </Section>

          <Section id="privacy-third" title="§12 Third-Party Processors">
            <p>
              We use the following third-party service providers to operate the platform. Each acts as a data processor on our behalf and is bound
              by a data processing agreement:
            </p>
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
                <div className="text-sm font-semibold text-zinc-200">Neon (Neon Inc.)</div>
                <div className="text-xs text-zinc-400">Serverless PostgreSQL database hosting. Stores all account data, spot metadata, comments, likes, and sessions.</div>
                <div className="text-xs text-zinc-500">Servers located in EU (Frankfurt, Germany). <a href="https://neon.tech/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a></div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
                <div className="text-sm font-semibold text-zinc-200">UploadThing (Ping Labs Inc.)</div>
                <div className="text-xs text-zinc-400">File storage and delivery for uploaded spot images. Images are stored on UploadThing's infrastructure and served via their CDN.</div>
                <div className="text-xs text-zinc-500">Servers may be located outside the EU — see §15. <a href="https://uploadthing.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a></div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
                <div className="text-sm font-semibold text-zinc-200">Vercel (Vercel Inc.)</div>
                <div className="text-xs text-zinc-400">Platform hosting and edge network. Serves the PlateVault web application and may process request data including IP addresses.</div>
                <div className="text-xs text-zinc-500">Infrastructure may be located outside the EU. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a></div>
              </div>
            </div>
            <p>We do not sell, rent, or share your data with any third party for their own purposes.</p>
          </Section>

          <Section id="privacy-rights" title="§13 Your Rights (GDPR)">
            <p>
              As a data subject under the GDPR, you have the following rights with respect to your personal data.
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:legal@platevault.app" className="text-indigo-400 hover:text-indigo-300">legal@platevault.app</a>.
              We will respond within 30 days.
            </p>
            <div className="space-y-2">
              {[
                { right: "Right of access (Art. 15)", desc: "You may request a copy of the personal data we hold about you." },
                { right: "Right to rectification (Art. 16)", desc: "You may request correction of inaccurate or incomplete personal data." },
                { right: "Right to erasure (Art. 17)", desc: "You may request deletion of your personal data. This right is subject to our retention obligations and our rights over user-submitted content described in §12." },
                { right: "Right to restriction (Art. 18)", desc: "You may request that we restrict processing of your data in certain circumstances." },
                { right: "Right to data portability (Art. 20)", desc: "You may request a machine-readable copy of personal data you have provided to us." },
                { right: "Right to object (Art. 21)", desc: "You may object to processing based on our legitimate interests. We will stop unless we can demonstrate compelling legitimate grounds." },
                { right: "Right to withdraw consent", desc: "Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing." },
              ].map((item) => (
                <div key={item.right} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-200 mb-0.5">{item.right}</div>
                    <div className="text-xs text-zinc-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="privacy-transfers" title="§14 International Transfers">
            <p>
              Some of our third-party processors (Vercel, UploadThing) operate infrastructure outside the European Economic Area,
              including in the United States. When we transfer personal data outside the EEA, we rely on appropriate safeguards as
              required by GDPR Chapter V, including Standard Contractual Clauses (SCCs) where applicable.
            </p>
            <p>
              By using PlateVault, you acknowledge that your data — particularly uploaded images — may be stored on servers outside the EEA.
            </p>
          </Section>

          <Section id="privacy-cookies" title="§15 Cookies & Sessions">
            <p>
              PlateVault uses a single essential cookie: <span className="font-mono text-xs text-zinc-200">pv_session</span>, which stores your
              session token to keep you logged in. This cookie is:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-sm ml-2">
              <li><strong className="text-zinc-300">HttpOnly</strong> — not accessible by JavaScript</li>
              <li><strong className="text-zinc-300">Secure</strong> — only transmitted over HTTPS</li>
              <li><strong className="text-zinc-300">SameSite: Lax</strong> — not sent on cross-site requests</li>
              <li>Expires after 30 days of inactivity</li>
            </ul>
            <p>
              We do not use advertising cookies, analytics cookies, or any tracking that persists beyond your session.
              No third-party cookies are set by the platform itself.
            </p>
            <p>
              This cookie is strictly necessary for the platform to function. As such, under GDPR Recital 47 and the German Telecommunications
              and Telemedia Data Protection Act (TTDSG), it does not require a separate consent banner.
            </p>
          </Section>

          <Section id="privacy-minors" title="§16 Minors">
            <p>
              PlateVault is not directed at children under the age of 16. We do not knowingly collect personal data from anyone under 16.
              If you believe we have inadvertently collected data from a minor, please contact us immediately at{" "}
              <a href="mailto:legal@platevault.app" className="text-indigo-400 hover:text-indigo-300">legal@platevault.app</a>{" "}
              and we will take steps to delete it.
            </p>
          </Section>

          <Section id="privacy-contact" title="§17 Contact & Complaints">
            <p>
              For any privacy-related questions or to exercise your rights, contact us at:{" "}
              <a href="mailto:legal@platevault.app" className="text-indigo-400 hover:text-indigo-300">legal@platevault.app</a>
            </p>
            <p>
              If you believe we have not handled your data correctly, you have the right to lodge a complaint with the competent supervisory
              authority. In Germany, this is the data protection authority of the state where we are established. You may also contact the
              Federal Commissioner for Data Protection and Freedom of Information (BfDI):
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-200">Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)</p>
              <p>Graurheindorfer Str. 153, 53117 Bonn, Germany</p>
              <p><a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">www.bfdi.bund.de</a></p>
            </div>
          </Section>

        </div>
      </div>
    </main>
  );
}
