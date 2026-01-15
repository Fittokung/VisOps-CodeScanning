// components/OnThisPage.tsx
"use client";

export default function OnThisPage({
  links,
}: {
  links: { title: string; href: string }[];
}) {
  return (
    <div className="hidden xl:block">
      <div className="sticky top-14 -mt-10 h-[calc(100vh-3.5rem)] overflow-hidden pt-10">
        <div className="space-y-2">
          <p className="font-medium text-sm text-slate-900">On this page</p>
          <ul className="m-0 list-none space-y-2 text-sm">
            {links.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="inline-block text-slate-500 no-underline transition-colors hover:text-blue-600"
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
