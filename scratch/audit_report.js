const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/import_test_report.json', 'utf8'));

const autoMatches = data.filter(r => r.status === "✅ LISTO");

const suspiciousNameMatches = autoMatches.filter(r => {
    // If reason is dorsal+name_compatible, it means isNameCompatible passed.
    // If reason is name_only, isNameCompatible passed.
    // We want to see if there are very short strings or weird combinations
    return r.nameInText.length < 5 || (r.nameInText.split(' ').length < 2 && r.riderFound.split(' ').length > 2);
});

// For categories, check if the sorted times are correct within each category
let timeOrderIssues = [];
let pointIssues = [];
let categories = [...new Set(data.map(r => r.categoryReceived))];
categories.forEach(cat => {
    let catData = data.filter(r => r.categoryReceived === cat).sort((a,b) => (a.calculatedPosition || 999) - (b.calculatedPosition || 999));
    let prevTime = 0;
    
    // timeToSeconds inline
    const t2s = (t) => {
        if (!t) return 999999;
        if (t.toUpperCase() === 'DQ') return 999999;
        const p = t.split(':').map(Number);
        if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
        if (p.length === 2) return p[0]*60 + p[1];
        return p[0] || 999999;
    };

    catData.forEach((r, idx) => {
        if(r.isDQ) return;
        const currentT = t2s(r.time);
        if (idx > 0) {
            if (currentT < prevTime) {
                timeOrderIssues.push({cat, a: catData[idx-1], b: r});
            }
        }
        prevTime = currentT;
    });
});

// Club differences
const clubDifferences = data.filter(r => r.clubReceived && r.clubAtEvent && r.clubReceived !== r.clubAtEvent);

const duplicates = [];
const idMap = new Map();
data.forEach(r => {
    if(!r.riderId) return;
    if(idMap.has(r.riderId)) {
        duplicates.push({ a: idMap.get(r.riderId), b: r });
    } else {
        idMap.set(r.riderId, r);
    }
});

console.log("=== SUSPICIOUS NAMES ===");
console.log(JSON.stringify(suspiciousNameMatches, null, 2));
console.log("=== TIME ORDER ISSUES ===");
console.log(JSON.stringify(timeOrderIssues, null, 2));
console.log("=== CLUB DIFFERENCES ===");
console.log(JSON.stringify(clubDifferences, null, 2));
console.log("=== DUPLICATES ===");
console.log(JSON.stringify(duplicates, null, 2));
