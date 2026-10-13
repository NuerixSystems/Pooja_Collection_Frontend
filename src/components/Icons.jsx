const base = {
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
};

const make = (children) =>
  function Icon({ size, ...props }) {
    return <svg {...base} {...(size ? { width: size, height: size } : {})} {...props}>{children}</svg>;
  };

export const MenuIcon = make(<><path d="M3 9h18" /><path d="M3 15h10" /></>);
export const SearchIcon = make(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const UserIcon = make(<><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.6-3.6 3.4-5.6 7-5.6s6.4 2 7 5.6" /></>);
export const HeartIcon = make(<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />);
export const BagIcon = make(<><path d="M5.5 8.5h13l-.9 11h-11.2Z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></>);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const MinusIcon = make(<path d="M5 12h14" />);
export const TrashIcon = make(<><path d="M4.5 7h15" /><path d="M9.5 7V5h5v2" /><path d="M6.5 7l.8 12h9.4l.8-12" /></>);

export const InstagramIcon = make(<><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" fill="currentColor" /></>);
export const WhatsAppIcon = make(<><path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 18.9Z" /><path d="M9.2 8.8c.2 2.6 2.4 4.9 5 5.1l1.1-1.1-1.8-1-.8.7a3.6 3.6 0 0 1-1.6-1.6l.7-.8-1-1.8Z" /></>);
export const PhoneIcon = make(<path d="M6.5 4h3l1.3 3.6-1.8 1.2a10 10 0 0 0 5.2 5.2l1.2-1.8 3.6 1.3v3a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />);
export const ArrowRightIcon = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const GemIcon = make(<><path d="M6.5 4h11l3.5 5-9 11L3 9Z" /><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" /></>);
export const AwardIcon = make(<><circle cx="12" cy="9" r="5.5" /><path d="m8.8 13.6-1.3 6.4 4.5-2.4 4.5 2.4-1.3-6.4" /></>);
export const GiftIcon = make(<><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18v-2.5H3ZM12 6.5V20M12 6.5C12 4 9 3 8.2 4.6 7.5 6 9.5 6.5 12 6.5Zm0 0c0-2.5 3-3.5 3.8-1.9.7 1.4-1.3 1.9-3.8 1.9Z" /></>);
export const ChatIcon = make(<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5Z" />);
export const StarIcon = make(<path d="M12 3.6l2.55 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.15 2.7 1-5.8-4.2-4.1 5.8-.8Z" />);
export const CheckCircleIcon = make(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.6-5" /></>);
