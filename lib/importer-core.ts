import { isNameCompatible } from './utils';

export function getRiderName(er: any) {
  if (!er?.riders) return null;
  if (Array.isArray(er.riders)) return er.riders[0]?.full_name;
  return er.riders.full_name;
}

export function matchAndDeduplicateResults(
  parsedRidersRaw: any[],
  eventRiders: any[],
  riders: any[],
  existingResults: any[],
  selectedEventId: string,
  selectedCategory: string,
  manualLinks: Record<string, string> = {}
) {
  const dorsalMap = new Map();
  const uniqueRiders: any[] = [];

  for (const item of parsedRidersRaw) {
    if (!item.dorsal) {
      uniqueRiders.push(item);
      continue;
    }
    const existing = dorsalMap.get(item.dorsal);
    if (!existing) {
      dorsalMap.set(item.dorsal, item);
      uniqueRiders.push(item);
    } else {
      const sameName = existing.riderName === item.riderName;
      const sameTime = existing.time === item.time;
      const sameCat = existing.category === item.category;
      
      if (sameName && sameTime && sameCat) {
        continue;
      } else {
        item.isConflict = true;
        existing.isConflict = true;
        uniqueRiders.push(item);
      }
    }
  }

  return uniqueRiders.map(item => {
    const puesto = item.position;
    const dorsal = item.dorsal.toString();
    const rawName = item.originalText.toUpperCase();
    const time = item.time;
    const isDQ = item.isDQ;
    const isConflict = item.isConflict;
    const nameInText = item.riderName;

    const entryByDorsal = eventRiders.find(er =>
      er.event_id === selectedEventId &&
      er.dorsal?.toString() === dorsal.toString()
    );

    const rowKey = `${dorsal}-${nameInText}-${time}`;
    const manualRiderId = manualLinks[rowKey];
    const manualRider = manualRiderId ? riders.find(r => r.id === manualRiderId) : null;

    const riderByName = !entryByDorsal && !manualRider ? riders.find(r => isNameCompatible(r.full_name, nameInText)) : null;
    const identifiedRiderId = manualRiderId || entryByDorsal?.rider_id || riderByName?.id || null;
    const identifiedName = manualRider?.full_name || getRiderName(entryByDorsal) || riderByName?.full_name || null;
    const riderProfile = riders.find(r => r.id === identifiedRiderId);

    let finalCategory = item.category !== "DESCONOCIDA" ? item.category :
      (entryByDorsal?.category_at_event || riderProfile?.category || selectedCategory || "DESCONOCIDA");

    if (finalCategory.toUpperCase().includes("PRE MASTER") || finalCategory.toUpperCase().includes("PREMASTER")) {
      finalCategory = "PRE MASTER MIXTO";
    }

    let status = "✅ LISTO";
    let canAutoLink = false;
    let matchReason = "";

    if (manualRiderId) {
      status = "🔧 CORREGIDO";
      canAutoLink = true;
      matchReason = "manual";
    } else if (entryByDorsal) {
      const pdfName = nameInText;
      const dbNameRaw = getRiderName(entryByDorsal);
      const compatible = isNameCompatible(pdfName, dbNameRaw);
      
      if (!compatible) {
        status = "⚠️ DORSAL SOSPECHOSO";
        matchReason = "incompatible_name";
      } else {
        status = "✅ LISTO";
        canAutoLink = true;
        matchReason = "dorsal+name_compatible";
      }
    } else if (riderByName) {
      status = "✅ LISTO";
      canAutoLink = true;
      matchReason = "name_only";
    } else {
      status = "❌ NO ENCONTRADO";
      matchReason = "not_found";
    }
    
    if (isDQ) status = "ℹ️ INFORMATIVO";
    if (isConflict) status = "⚠️ CONFLICTO MULTIARCHIVO";

    const alreadySaved = existingResults.find(er => er.event_id === selectedEventId && er.rider_id === identifiedRiderId);
    let changeType = "NUEVO";
    let updateDetail = "";

    const normalizeTime = (t: string | null | undefined) => {
      if (!t) return '';
      let clean = t.trim().toUpperCase();
      if (clean.startsWith('0') && clean.includes(':')) clean = clean.substring(1);
      return clean;
    };

    if (alreadySaved) {
      const timeMatches = normalizeTime(alreadySaved.race_time) === normalizeTime(time);
      changeType = timeMatches ? "SIN CAMBIOS" : "SOBREESCRIBIR";
      if (changeType === "SOBREESCRIBIR") {
        updateDetail = `T: ${alreadySaved.race_time} → ${time}`;
      }
    } else if (isDQ) {
      changeType = "IGNORAR";
    }

    return {
      rowKey, dorsal, puesto: puesto || '-', nameInText: rawName, identifiedName,
      category: finalCategory, time, isDQ, riderId: identifiedRiderId,
      exists: !!entryByDorsal, canAutoLink, status, changeType, updateDetail,
      matchReason, clubInText: item.club || null, clubAtEvent: entryByDorsal?.club_at_event || null
    };
  });
}

export const timeToSeconds = (timeStr: string) => {
  if (timeStr.toUpperCase() === 'DQ') return 999999;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 999999;
};

export const calculatePoints = (pos: number, isDQ: boolean = false) => {
  if (isDQ || pos === 999) return 0;
  if (pos === 1) return 100;
  if (pos <= 10) return 110 - (pos * 10);
  if (pos < 20) return 20 - pos;
  return 1;
};
