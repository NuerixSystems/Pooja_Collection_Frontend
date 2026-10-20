@'
// Central icon set.
const make = (children, { fill = 'none', strokeWidth = 1.8, viewBox = '0 0 24 24' } = {}) =>
  function Icon({ size = 24, className = '', ...rest }) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={viewBox}
        fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
        strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
        {children}
      </svg>
    );
  };

export const MenuIcon = make(<><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>);
export const SearchIcon = make(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const UserIcon = make(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>);
export const HeartIcon = make(<path d="M12 20.5S3.5 14 3.5 8.5a4.5 4.5 0 0 1 8.5-2.5 4.5 4.5 0 0 1 8.5 2.5c0 5.5-8.5 12-8.5 12Z" />, { fill: 'none' });
export const BagIcon = make(<><path d="M5.5 8.5h13l-.9 11h-11.2Z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></>);
export const ArrowLeftIcon = make(<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>);
export const ArrowRightIcon = make(<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>);
export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />);
export const ChevronRightIcon = make(<path d="m9 6 6 6-6 6" />);
export const CloseIcon = make(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>);
export const CartIcon = make(<><path d="M2 3h2.6l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 7H5.6" /><circle cx="9.5" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></>, { strokeWidth: 1.6 });
export const TrashIcon = make(<><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6" /><path d="M14 11v6" /></>);
export const PlusIcon = make(<><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const MinusIcon = make(<path d="M5 12h14" />);
export const CheckIcon = make(<path d="m5 13 4 4L19 7" />);
export const CheckCircleIcon = make(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.6-5" /></>);
export const WhatsAppIcon = make(<path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.9.92-3-.2-.31a8.2 8.2 0 1 1 6.86 3.74Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.42h-.47c-.16 0-.43.06-.65.3-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.73 2.64 4.2 3.7 1.56.67 2.17.73 2.95.62.48-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.28Z" />, { fill: 'currentColor', strokeWidth: 0 });
export const PhoneIcon = make(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />);
export const InstagramIcon = make(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>);
export const StarIcon = make(<path d="m12 3 2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.8l-5.8 3.05 1.1-6.47L2.6 9.85l6.5-.95L12 3Z" />);
export const GemIcon = make(<><path d="M6.5 4h11l3.5 5-9 11L3 9Z" /><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" /></>);
export const AwardIcon = make(<><circle cx="12" cy="9" r="5.5" /><path d="m8.8 13.6-1.3 6.4 4.5-2.4 4.5 2.4-1.3-6.4" /></>);
export const GiftIcon = make(<><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18v-2.5H3ZM12 6.5V20M12 6.5C12 4 9 3 8.2 4.6 7.5 6 9.5 6.5 12 6.5Zm0 0c0-2.5 3-3.5 3.8-1.9.7 1.4-1.3 1.9-3.8 1.9Z" /></>);
export const ChatIcon = make(<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5Z" />);
export const PackageIcon = make(<><path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" /><path d="M3.3 7 12 12l8.7-5" /><path d="M12 12v9" /></>);
export const EditIcon = make(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>);
export const LockIcon = make(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
'@ | Out-File -FilePath src\components\Icons.jsx -Encoding utf8