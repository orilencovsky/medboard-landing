import * as React from 'react';
import { Navbar } from 'meduxa-landing-ds';

const links = [
  { label: 'The Science', href: '#science' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Vision', href: '#vision' },
];

export function Default() {
  return <Navbar links={links} langHref="/he" langLabel="עברית" ctaHref="#pilot" ctaLabel="Get Early Access" ctaLabelShort="Join" />;
}
