const organizersByDate = [
  { name: 'Team Franklin', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/Logo%20PNG-04.png' },
  { name: 'Chaski', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/chaski.png' },
  { name: 'Club TMT', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/tmtclub.png' },
  { name: 'Cobra', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/cobraclub.png' },
  { name: 'Condores', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/condores.png' },
  { name: 'Iquique Bike', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/iquiquebikepng.png' },
  { name: 'Camanchaca', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/camanchaca.png' },
];

const getClubLogo = (clubName) => {
    if (!clubName || clubName === 'INDEPENDIENTE / LIBRE') return null;
    const cleanName = clubName.toLowerCase().replace('club', '').replace('team', '').trim();
    // Buscar en organizersByDate
    const organizer = organizersByDate.find(o => {
        const orgClean = o.name.toLowerCase().replace('club', '').replace('team', '').trim();
        return orgClean.length >= 3 && (cleanName.includes(orgClean) || orgClean.includes(cleanName));
    });
    return organizer ? organizer.logo : null;
};

console.log('Logo para CONDORES B&T:', getClubLogo('CONDORES B&T'));
