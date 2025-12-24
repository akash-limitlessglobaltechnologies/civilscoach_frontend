// Complete country codes data for international phone verification
// Supports 240+ countries with flags, common names, and dialing codes

export const countryCodes = [
  // Popular countries (shown first)
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳', popular: true },
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸', popular: true },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧', popular: true },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦', popular: true },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺', popular: true },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪', popular: true },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷', popular: true },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵', popular: true },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳', popular: true },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷', popular: true },

  // All countries A-Z
  { code: '+93', country: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: '+358', country: 'AX', name: 'Aland Islands', flag: '🇦🇽' },
  { code: '+355', country: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: '+213', country: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: '+1684', country: 'AS', name: 'American Samoa', flag: '🇦🇸' },
  { code: '+376', country: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: '+244', country: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: '+1264', country: 'AI', name: 'Anguilla', flag: '🇦🇮' },
  { code: '+672', country: 'AQ', name: 'Antarctica', flag: '🇦🇶' },
  { code: '+1268', country: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+374', country: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: '+297', country: 'AW', name: 'Aruba', flag: '🇦🇼' },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺', popular: false },
  { code: '+43', country: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: '+994', country: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+1242', country: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: '+973', country: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', country: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+1246', country: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: '+375', country: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: '+32', country: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: '+501', country: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: '+229', country: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: '+1441', country: 'BM', name: 'Bermuda', flag: '🇧🇲' },
  { code: '+975', country: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: '+591', country: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+599', country: 'BQ', name: 'Bonaire, Sint Eustatius and Saba', flag: '🇧🇶' },
  { code: '+387', country: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: '+267', country: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷', popular: false },
  { code: '+246', country: 'IO', name: 'British Indian Ocean Territory', flag: '🇮🇴' },
  { code: '+673', country: 'BN', name: 'Brunei Darussalam', flag: '🇧🇳' },
  { code: '+359', country: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: '+226', country: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+257', country: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: '+855', country: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: '+237', country: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦', popular: false },
  { code: '+238', country: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
  { code: '+1345', country: 'KY', name: 'Cayman Islands', flag: '🇰🇾' },
  { code: '+236', country: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: '+235', country: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: '+56', country: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳', popular: false },
  { code: '+61', country: 'CX', name: 'Christmas Island', flag: '🇨🇽' },
  { code: '+61', country: 'CC', name: 'Cocos (Keeling) Islands', flag: '🇨🇨' },
  { code: '+57', country: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: '+269', country: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: '+242', country: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: '+243', country: 'CD', name: 'Congo, Democratic Republic of the', flag: '🇨🇩' },
  { code: '+682', country: 'CK', name: 'Cook Islands', flag: '🇨🇰' },
  { code: '+506', country: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+225', country: 'CI', name: 'Cote d\'Ivoire', flag: '🇨🇮' },
  { code: '+385', country: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: '+53', country: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: '+599', country: 'CW', name: 'Curacao', flag: '🇨🇼' },
  { code: '+357', country: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: '+420', country: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+45', country: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: '+253', country: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: '+1767', country: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: '+1809', country: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+593', country: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+20', country: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: '+503', country: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+240', country: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+291', country: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: '+372', country: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: '+251', country: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+500', country: 'FK', name: 'Falkland Islands (Malvinas)', flag: '🇫🇰' },
  { code: '+298', country: 'FO', name: 'Faroe Islands', flag: '🇫🇴' },
  { code: '+679', country: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: '+358', country: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷', popular: false },
  { code: '+594', country: 'GF', name: 'French Guiana', flag: '🇬🇫' },
  { code: '+689', country: 'PF', name: 'French Polynesia', flag: '🇵🇫' },
  { code: '+262', country: 'TF', name: 'French Southern Territories', flag: '🇹🇫' },
  { code: '+241', country: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: '+220', country: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: '+995', country: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪', popular: false },
  { code: '+233', country: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: '+350', country: 'GI', name: 'Gibraltar', flag: '🇬🇮' },
  { code: '+30', country: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: '+299', country: 'GL', name: 'Greenland', flag: '🇬🇱' },
  { code: '+1473', country: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: '+590', country: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: '+1671', country: 'GU', name: 'Guam', flag: '🇬🇺' },
  { code: '+502', country: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+44', country: 'GG', name: 'Guernsey', flag: '🇬🇬' },
  { code: '+224', country: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: '+245', country: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+592', country: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: '+509', country: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: '+379', country: 'VA', name: 'Holy See (Vatican City State)', flag: '🇻🇦' },
  { code: '+504', country: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: '+852', country: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+36', country: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: '+354', country: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳', popular: false },
  { code: '+62', country: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', country: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: '+964', country: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: '+353', country: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: '+44', country: 'IM', name: 'Isle of Man', flag: '🇮🇲' },
  { code: '+972', country: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: '+39', country: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: '+1876', country: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵', popular: false },
  { code: '+44', country: 'JE', name: 'Jersey', flag: '🇯🇪' },
  { code: '+962', country: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: '+7', country: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+254', country: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: '+686', country: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: '+850', country: 'KP', name: 'Korea, Democratic People\'s Republic of', flag: '🇰🇵' },
  { code: '+82', country: 'KR', name: 'Korea, Republic of', flag: '🇰🇷' },
  { code: '+965', country: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+996', country: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+856', country: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: '+371', country: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: '+961', country: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+266', country: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: '+231', country: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: '+218', country: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: '+423', country: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: '+370', country: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: '+352', country: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: '+853', country: 'MO', name: 'Macao', flag: '🇲🇴' },
  { code: '+389', country: 'MK', name: 'Macedonia', flag: '🇲🇰' },
  { code: '+261', country: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: '+265', country: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: '+60', country: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+960', country: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: '+223', country: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: '+356', country: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: '+692', country: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: '+596', country: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: '+222', country: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: '+230', country: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: '+269', country: 'YT', name: 'Mayotte', flag: '🇾🇹' },
  { code: '+52', country: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: '+691', country: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: '+373', country: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: '+377', country: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: '+976', country: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: '+382', country: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: '+1664', country: 'MS', name: 'Montserrat', flag: '🇲🇸' },
  { code: '+212', country: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: '+258', country: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: '+95', country: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+264', country: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: '+674', country: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: '+977', country: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: '+31', country: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+687', country: 'NC', name: 'New Caledonia', flag: '🇳🇨' },
  { code: '+64', country: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+505', country: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+227', country: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: '+234', country: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+683', country: 'NU', name: 'Niue', flag: '🇳🇺' },
  { code: '+672', country: 'NF', name: 'Norfolk Island', flag: '🇳🇫' },
  { code: '+1670', country: 'MP', name: 'Northern Mariana Islands', flag: '🇲🇵' },
  { code: '+47', country: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: '+968', country: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: '+92', country: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+680', country: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: '+970', country: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: '+507', country: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: '+675', country: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: '+595', country: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', country: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: '+63', country: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: '+64', country: 'PN', name: 'Pitcairn', flag: '🇵🇳' },
  { code: '+48', country: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: '+1787', country: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+974', country: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: '+262', country: 'RE', name: 'Reunion', flag: '🇷🇪' },
  { code: '+40', country: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: '+7', country: 'RU', name: 'Russian Federation', flag: '🇷🇺' },
  { code: '+250', country: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: '+590', country: 'BL', name: 'Saint Barthelemy', flag: '🇧🇱' },
  { code: '+290', country: 'SH', name: 'Saint Helena', flag: '🇸🇭' },
  { code: '+1869', country: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: '+1758', country: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: '+590', country: 'MF', name: 'Saint Martin', flag: '🇲🇫' },
  { code: '+508', country: 'PM', name: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
  { code: '+1784', country: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: '+685', country: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: '+378', country: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: '+239', country: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+221', country: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: '+381', country: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: '+248', country: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: '+232', country: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: '+1721', country: 'SX', name: 'Sint Maarten', flag: '🇸🇽' },
  { code: '+421', country: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: '+386', country: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: '+677', country: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: '+252', country: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: '+27', country: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: '+500', country: 'GS', name: 'South Georgia and the South Sandwich Islands', flag: '🇬🇸' },
  { code: '+211', country: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: '+34', country: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: '+94', country: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+249', country: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: '+597', country: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: '+47', country: 'SJ', name: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
  { code: '+268', country: 'SZ', name: 'Swaziland', flag: '🇸🇿' },
  { code: '+46', country: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+963', country: 'SY', name: 'Syrian Arab Republic', flag: '🇸🇾' },
  { code: '+886', country: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: '+992', country: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: '+255', country: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+66', country: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: '+670', country: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+228', country: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: '+690', country: 'TK', name: 'Tokelau', flag: '🇹🇰' },
  { code: '+676', country: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: '+1868', country: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: '+216', country: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+90', country: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: '+993', country: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+1649', country: 'TC', name: 'Turks and Caicos Islands', flag: '🇹🇨' },
  { code: '+688', country: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: '+256', country: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: '+380', country: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+971', country: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧', popular: false },
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸', popular: false },
  { code: '+598', country: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+998', country: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+678', country: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: '+58', country: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+84', country: 'VN', name: 'Viet Nam', flag: '🇻🇳' },
  { code: '+1284', country: 'VG', name: 'Virgin Islands, British', flag: '🇻🇬' },
  { code: '+1340', country: 'VI', name: 'Virgin Islands, U.S.', flag: '🇻🇮' },
  { code: '+681', country: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫' },
  { code: '+212', country: 'EH', name: 'Western Sahara', flag: '🇪🇭' },
  { code: '+967', country: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: '+260', country: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' }
];

// Get popular countries (shown at top of dropdown)
export const getPopularCountries = () => {
  return countryCodes.filter(country => country.popular === true);
};

// Get all countries excluding popular ones (for main list)
export const getAllCountries = () => {
  return countryCodes.filter(country => country.popular !== true);
};

// Get all countries sorted alphabetically
export const getAllCountriesSorted = () => {
  return [...countryCodes].sort((a, b) => a.name.localeCompare(b.name));
};

// Search countries by name or code
export const searchCountries = (query) => {
  const searchTerm = query.toLowerCase();
  return countryCodes.filter(country => 
    country.name.toLowerCase().includes(searchTerm) ||
    country.code.includes(searchTerm) ||
    country.country.toLowerCase().includes(searchTerm)
  );
};

// Get country by country code (e.g., 'IN', 'US')
export const getCountryByCode = (countryCode) => {
  return countryCodes.find(country => 
    country.country === countryCode.toUpperCase()
  );
};

// Get country by dialing code (e.g., '+91', '+1')
export const getCountryByDialCode = (dialCode) => {
  return countryCodes.find(country => 
    country.code === dialCode
  );
};

// Format phone number with country code
export const formatPhoneNumber = (phoneNumber, countryCode) => {
  const country = getCountryByCode(countryCode);
  if (!country) return phoneNumber;
  
  // Remove any existing country code or special characters
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  
  // Add country code
  return `${country.code}${cleanNumber}`;
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber, countryCode) => {
  const formatted = formatPhoneNumber(phoneNumber, countryCode);
  
  // Basic validation - should start with + and contain 7-15 digits
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(formatted);
};

// Get formatted display text for country
export const getCountryDisplayText = (country) => {
  return `${country.flag} ${country.name} (${country.code})`;
};

export default countryCodes;