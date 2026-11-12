export const metadata = {
  title: "Community Rules — PlateVault",
  description: "Rules and guidelines for the PlateVault community.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <h2 className="text-lg font-bold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">{children}</div>
    </section>
  );
}

function Rule({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 font-mono text-xs text-zinc-600 mt-0.5 w-8">{n}</span>
      <p>{children}</p>
    </div>
  );
}

function SubRule({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 ml-8">
      <span className="shrink-0 font-mono text-xs text-zinc-600 mt-0.5 w-10">{n}</span>
      <p className="text-zinc-400">{children}</p>
    </div>
  );
}

export default function RulesPage() {
  const toc = [
    { id: "about", label: "1. About PlateVault" },
    { id: "registration", label: "2. Registration" },
    { id: "uploads", label: "3. Uploading Spots" },
    { id: "quality", label: "4. Photo Quality" },
    { id: "content", label: "5. Prohibited Content" },
    { id: "location", label: "6. Location" },
    { id: "comments", label: "7. Comments & Conduct" },
    { id: "moderation", label: "8. Moderation & Sanctions" },
    { id: "ip", label: "9. Intellectual Property" },
    { id: "liability", label: "10. Liability" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">

      {/* Header */}
      <div className="mb-10 flex items-start gap-3">
        <div className="hidden" />
        <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">PlateVault</p>
        <h1 className="text-3xl font-black text-zinc-50">Community Rules</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Last updated: November 2026 · These rules apply to all users of PlateVault.
        </p>
        <p className="mt-3 text-sm text-zinc-400">
          By registering an account on PlateVault, you confirm that you have read, understood, and agreed to these rules in their entirety.
          Continued use of the platform constitutes ongoing acceptance of any updated version.
        </p>
        </div>
      </div>

      {/* The short version */}
      <section aria-label="The short version" className="mb-12">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">The short version</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "📸", title: "Real photos only", text: "Your own, not AI-made, not edited beyond light tone fixes.", href: "#uploads" },
            { icon: "🔍", title: "Plate must be readable", text: "Whole plate legible, vehicle clearly in the frame.", href: "#quality" },
            { icon: "📍", title: "Place first", text: "The description starts with city + country — never a street or house number.", href: "#location" },
            { icon: "♻️", title: "No pointless duplicates", text: "A repeat is fine only when something is new: plate, angle, change, country.", href: "#uploads" },
            { icon: "🤝", title: "Be decent", text: "Respect everyone, no spam or ads. Say thanks with a like, not a comment.", href: "#comments" },
            { icon: "🚩", title: "Report, don't argue", text: "Spotted a mistake? Use the report button and let the team handle it.", href: "#moderation" },
          ].map((c) => (
            <a key={c.title} href={c.href}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-indigo-500/60 hover:bg-zinc-900">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-lg ring-1 ring-indigo-500/20" aria-hidden="true">{c.icon}</span>
                <span className="text-sm font-semibold text-zinc-100 group-hover:text-white">{c.title}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{c.text}</p>
            </a>
          ))}
        </div>
      </section>

      <div className="flex gap-12 items-start">

        {/* Table of contents — sticky sidebar */}
        <aside className="hidden lg:block shrink-0 w-52 sticky top-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Contents</div>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-xs text-zinc-400 hover:text-indigo-300 py-0.5 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          <Section id="about" title="1. About PlateVault">
            <Rule n="1.1">
              PlateVault is a community-driven archive for spotting and cataloguing vehicle license plates from around the world.
              It is a non-commercial public space where users can upload photos of spotted plates, browse by country, and engage with
              other enthusiasts.
            </Rule>
            <Rule n="1.2">
              The platform is operated by PlateVault and moderated by a team of administrators and moderators appointed by the owner.
              The moderation team reserves the right to make final decisions on all matters relating to the platform.
            </Rule>
            <Rule n="1.3">
              PlateVault strives to maintain 24/7 availability but does not guarantee uninterrupted service. Maintenance, technical issues,
              or other circumstances may cause temporary downtime.
            </Rule>
          </Section>

          <Section id="registration" title="2. Registration">
            <Rule n="2.1">
              Registration is free, personal, and voluntary. Only natural persons may register — registering on behalf of a legal entity,
              organisation, or government body is prohibited.
            </Rule>
            <Rule n="2.2">
              Each person may hold only one account. Creating multiple accounts is prohibited. Attempting to bypass a ban by registering a
              new account will result in a permanent ban of all associated accounts.
            </Rule>
            <Rule n="2.3">
              Usernames must not impersonate another person, be offensive or derogatory, or be so similar to an existing username as to
              cause confusion.
            </Rule>
            <Rule n="2.4">
              You are responsible for keeping your account credentials secure. Any action taken through your account is your responsibility,
              whether or not it was authorised by you.
            </Rule>
            <Rule n="2.5">
              To request account deletion, contact the administration. Uploaded content may be retained in accordance with our
              <a href="/legal" className="text-indigo-400 hover:text-indigo-300 ml-1">Privacy Policy</a>.
            </Rule>
          </Section>

          <Section id="uploads" title="3. Uploading Spots">
            <Rule n="3.1">
              A spot is a photo of a real vehicle bearing a real, legitimate license plate. The plate must be clearly legible in the photo.
            </Rule>
            <Rule n="3.2">
              You may only upload photos that you personally took, or for which you have explicit written permission from the original photographer.
              By uploading, you confirm you hold the necessary rights.
            </Rule>
            <Rule n="3.3">
              The following are prohibited from being uploaded as spots:
            </Rule>
            <SubRule n="3.3.a">Photos generated, altered, or enhanced by artificial intelligence or machine-learning tools.</SubRule>
            <SubRule n="3.3.b">Photos of counterfeit, replica, souvenir, or otherwise non-genuine license plates.</SubRule>
            <SubRule n="3.3.c">Photos taken from a screen, monitor, TV, or another photograph (a photo of a photo).</SubRule>
            <SubRule n="3.3.d">Photos in which the license plate has been digitally modified, obscured, or fabricated.</SubRule>
            <SubRule n="3.3.e">Photos that do not show a real, road-registered vehicle with a plate fitted to it (exceptions apply for standalone plate photos — see 3.6).</SubRule>
            <SubRule n="3.3.f">Photos where the primary subject is not the vehicle or plate (e.g. landscapes, portraits, unrelated objects).</SubRule>
            <Rule n="3.4">
              Each upload must include the correct plate text as it appears on the physical plate, the country of registration, and a description that starts with the
              place it was spotted (city + country at minimum — see Section 6).
            </Rule>
            <Rule n="3.5">
              Plate text must be entered exactly as it appears on the plate, including spacing and separators where they are part of the official format.
            </Rule>
            <Rule n="3.6">
              Standalone photos of a plate not fitted to a vehicle are permitted only when no photo of that plate fitted to a vehicle exists in the archive.
              The plate must occupy at least one-third of the frame, be photographed straight-on, and be clearly legible.
            </Rule>
            <Rule n="3.7">
              Minor image adjustments (brightness, contrast, colour balance, crop) are permitted. Compositing, heavy filtering, or any alteration that
              misrepresents the original scene is not.
            </Rule>
            <Rule n="3.8">
              <strong className="text-zinc-100">Tag what is actually there.</strong> Choose the plate type that matches the plate, and add make, model and
              generation when you can see or are sure of them. If you are not sure, leave the field empty rather than guessing.
            </Rule>
            <Rule n="3.9">
              <strong className="text-zinc-100">Duplicates.</strong> Do not upload the same plate on the same vehicle twice. A repeat is welcome when it adds something new:
            </Rule>
            <SubRule n="3.9.a">a different plate, or a different vehicle wearing the same plate;</SubRule>
            <SubRule n="3.9.b">a clearly different angle or scene;</SubRule>
            <SubRule n="3.9.c">a visible change to the vehicle or the plate (modifications, new plate type, new tag);</SubRule>
            <SubRule n="3.9.d">a different country or region.</SubRule>
            <Rule n="3.10">
              Otherwise, add what you know as a comment on the original spot instead of uploading it again.
            </Rule>
            <Rule n="3.11">
              <strong className="text-zinc-100">Replacing photos.</strong> Ask for a replacement only when the new photo is clearly better — sharper, better lit, plate fully readable.
              Do not swap photos back and forth, and do not replace a good photo with a similar one.
            </Rule>
          </Section>

          <Section id="quality" title="4. Photo Quality">
            <Rule n="4.1">
              The license plate in the photo must be fully visible and all characters must be readable. Partially obscured, blurry, or unreadable
              plates are not accepted.
            </Rule>
            <Rule n="4.2">
              The vehicle must be substantially present in the frame. A photo showing only the plate with no visible vehicle body will be rejected
              unless submitted as a standalone plate photo (see 3.6).
            </Rule>
            <Rule n="4.3">
              Photos must be taken in adequate lighting. Extremely dark, overexposed, or heavily pixelated images may be removed.
            </Rule>
            <Rule n="4.4">
              Photos must be in landscape or square orientation. Minimum resolution is 640×480 pixels.
            </Rule>
            <Rule n="4.5">
              The moderation team may remove or hide low-quality photos at their discretion, particularly when a higher-quality photo of the same
              plate already exists in the archive.
            </Rule>
          </Section>

          <Section id="content" title="5. Prohibited Content">
            <Rule n="5.1">
              The following content is strictly prohibited on PlateVault in any form, including uploads, comments, and profile information:
            </Rule>
            <SubRule n="5.1.a">Pornographic, sexually explicit, or obscene material.</SubRule>
            <SubRule n="5.1.b">Content depicting violence, gore, or graphic injury.</SubRule>
            <SubRule n="5.1.c">Content that incites hatred based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or any other characteristic.</SubRule>
            <SubRule n="5.1.d">Photos showing accident scenes where victims or injuries are visible.</SubRule>
            <SubRule n="5.1.e">Unretouched faces of identifiable private individuals (public figures in their official capacity are excepted).</SubRule>
            <SubRule n="5.1.f">Unretouched street addresses, house numbers, or other precise location identifiers attached to private property.</SubRule>
            <SubRule n="5.1.g">Personal data of private individuals (home addresses, phone numbers, etc.) without their consent.</SubRule>
            <SubRule n="5.1.h">Unsolicited advertising or spam of any kind.</SubRule>
            <Rule n="5.2">
              Any upload or comment found to contain prohibited content will be removed immediately. Depending on severity, the responsible user
              may be permanently banned without prior warning.
            </Rule>
          </Section>

          <Section id="location" title="6. Location">
            <Rule n="6.1">
              Every spot has one <strong className="text-zinc-100">Description</strong>. It starts with the place where the photo was taken — at minimum the city
              and country, for example <span className="font-mono text-zinc-200">Berlin, Germany</span> or <span className="font-mono text-zinc-200">Tirana, Albania</span> —
              and then, if you like, anything else worth saying about the sighting (and #hashtags).
            </Rule>
            <Rule n="6.2">
              The location must reflect where the photo was taken, not where the vehicle is registered.
            </Rule>
            <Rule n="6.3">
              Street names, house numbers, precise GPS coordinates, or any information that could identify a private address are not permitted
              in the description.
            </Rule>
            <Rule n="6.4">
              Providing a false or deliberately misleading location is a violation of these rules and may result in removal of the spot and
              sanctions against the uploader.
            </Rule>
            <Rule n="6.5">
              If you are not the photographer, say so in the description, credit them by name, and only post the photo with their consent (see 3.2).
            </Rule>
          </Section>

          <Section id="comments" title="7. Comments & Conduct">
            <Rule n="7.1">
              All communication on PlateVault — comments, profile information, and any other user-generated text — must adhere to basic
              standards of respect and decency.
            </Rule>
            <Rule n="7.2">The following are prohibited in comments and all other user-submitted text:</Rule>
            <SubRule n="7.2.a">Insults, harassment, or targeted abuse directed at any user or group.</SubRule>
            <SubRule n="7.2.b">Hate speech of any kind (see 5.1.c).</SubRule>
            <SubRule n="7.2.c">Spam, including repeated identical messages or unsolicited self-promotion.</SubRule>
            <SubRule n="7.2.d">Sharing personal data of other users or third parties without their consent.</SubRule>
            <SubRule n="7.2.e">Impersonating another user, moderator, administrator, or public figure.</SubRule>
            <Rule n="7.3">
              Comments should be relevant to the spot. Off-topic discussions, flame wars, or attempts to provoke other users will be removed.
            </Rule>
            <Rule n="7.4">
              Disputes with moderation decisions must be raised through appropriate channels (contact form or direct message to an administrator).
              Publicly attacking moderators or administrators in comments is prohibited.
            </Rule>
            <Rule n="7.5">
              The administration reserves the right to remove any comment at any time without explanation.
            </Rule>
            <Rule n="7.6">
              To say thanks or show you like a spot, use the like button — a comment that only says "nice" or "thanks" is noise.
            </Rule>
            <Rule n="7.7">
              No advertising, no asking for likes or follows, and no posting the same comment on many spots. Links are fine when they genuinely relate to the spot
              (for example a source or a related photo).
            </Rule>
            <Rule n="7.8">
              Do not use comments to point out mistakes or to push a "better" replacement photo. Use the report button on the spot instead (see 8.7).
            </Rule>
          </Section>

          <Section id="moderation" title="8. Moderation & Sanctions">
            <Rule n="8.1">
              The moderation team (administrators and moderators) is responsible for enforcing these rules. Their decisions are final unless
              successfully appealed to an administrator.
            </Rule>
            <Rule n="8.2">
              Sanctions escalate in steps: <strong className="text-zinc-100">content removal → warning → temporary ban → permanent exclusion</strong>.
              Which step applies depends on the nature and severity of the violation and on whether it is a repeat.
            </Rule>
            <Rule n="8.3">
              The following violations may result in immediate permanent exclusion without prior warning:
            </Rule>
            <SubRule n="8.3.a">Posting content prohibited under Section 5.</SubRule>
            <SubRule n="8.3.b">Creating multiple accounts to evade a ban.</SubRule>
            <SubRule n="8.3.c">Any attempt to compromise the security or integrity of the platform.</SubRule>
            <Rule n="8.4">
              Temporary bans typically range from 3 to 30 days depending on the violation. Repeat violations result in escalating sanctions.
              Malicious repeat violations may result in a permanent ban.
            </Rule>
            <Rule n="8.5">
              Users may appeal a sanction by contacting an administrator directly. Appeals must be made in good faith and within a reasonable
              time after the sanction is imposed.
            </Rule>
            <Rule n="8.6">
              Sanctions are normally imposed within a month of the violation being noticed, and the user is told which rule was broken.
            </Rule>
            <Rule n="8.7">
              <strong className="text-zinc-100">Reporting problems.</strong> Wrong plate text, wrong vehicle or tags, a duplicate, or content that should be hidden or removed:
              use the report button on the spot. Reports are read by the moderation team; please do not argue about them in comments.
            </Rule>
            <Rule n="8.8">
              The administration may update these rules at any time. Continued use of the platform after an update constitutes acceptance of the
              revised rules.
            </Rule>
          </Section>

          <Section id="ip" title="9. Intellectual Property">
            <Rule n="9.1">
              By uploading a photo to PlateVault, you grant PlateVault a worldwide, royalty-free, non-exclusive licence to store, display,
              resize, and distribute that photo on the platform and in connection with it.
            </Rule>
            <Rule n="9.2">
              You retain your copyright. The licence granted in 9.1 does not transfer ownership of your photos to PlateVault.
            </Rule>
            <Rule n="9.3">
              You confirm that you own or have the right to use any photo you upload, and that uploading it does not infringe any third
              party's rights. You bear sole responsibility for any claim arising from content you upload.
            </Rule>
            <Rule n="9.4">
              Uploaded photos are retained by PlateVault unless you request their removal and the administration approves it, or the
              administration independently decides to remove them. See our <a href="/legal" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a> for details.
            </Rule>
            <Rule n="9.5">
              PlateVault's name, logo, and visual identity are its exclusive property and may not be reproduced or used without written permission.
            </Rule>
          </Section>

          <Section id="liability" title="10. Liability">
            <Rule n="10.1">
              PlateVault is provided as-is. We do not guarantee that the platform will be available at all times, free of errors, or suitable
              for any particular purpose.
            </Rule>
            <Rule n="10.2">
              PlateVault is not responsible for content uploaded by users. Users are solely responsible for the legality and accuracy of
              the content they submit.
            </Rule>
            <Rule n="10.3">
              PlateVault is not liable for any damages — direct, indirect, or consequential — arising from use of or inability to use the platform.
            </Rule>
            <Rule n="10.4">
              Links to third-party websites are provided for convenience only. PlateVault has no control over and accepts no responsibility
              for third-party content.
            </Rule>
          </Section>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-400">
            <p>
              Questions about these rules? Contact the moderation team via the{" "}
              <a href="/contact" className="text-indigo-400 hover:text-indigo-300">contact page</a> or by messaging an administrator directly.
              For legal matters, see our{" "}
              <a href="/legal" className="text-indigo-400 hover:text-indigo-300">Terms of Service & Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
