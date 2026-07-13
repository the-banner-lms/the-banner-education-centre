export const getRoleBannerGradient = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-gradient-to-r from-slate-700 via-gray-800 to-black';
    case 'staff':
      return 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600';
    case 'teacher':
      return 'bg-gradient-to-r from-teal-500 via-emerald-500 to-green-600';
    case 'student':
    default:
      return 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500';
  }
};

export const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-gray-200 text-gray-800';
    case 'staff':
      return 'bg-orange-100 text-orange-800';
    case 'teacher':
      return 'bg-teal-100 text-teal-800';
    case 'student':
    default:
      return 'bg-indigo-100 text-indigo-800';
  }
};
