// Lit le calendrier Airbnb et renvoie la liste des nuits réservées.
// Le lien Airbnb se règle dans Netlify : Site configuration > Environment variables > AIRBNB_ICAL

export default async () => {
  const url = process.env.AIRBNB_ICAL;
  const entetes = {
    "Content-Type": "application/json",
    // Netlify garde la réponse 30 minutes en mémoire
    "Cache-Control": "public, max-age=0",
    "Netlify-CDN-Cache-Control": "public, s-maxage=1800",
  };

  if (!url) return new Response("[]", { headers: entetes });

  try {
    const reponse = await fetch(url);
    const ics = await reponse.text();
    const dates = new Set();
    const enDate = s => new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
    // Chaque réservation est lue séparément (Airbnb met parfois la fin avant le début)
    for (const bloc of ics.split("BEGIN:VEVENT").slice(1)) {
      const debut = bloc.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
      const finM = bloc.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/);
      if (!debut || !finM) continue;
      const d = enDate(debut[1]);
      const fin = enDate(finM[1]);
      while (d < fin) {                    // la date de départ reste libre
        dates.add(d.toISOString().slice(0, 10));
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    return new Response(JSON.stringify([...dates]), { headers: entetes });
  } catch (e) {
    return new Response("[]", { headers: entetes });
  }
};
