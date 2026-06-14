import "dotenv/config";
import http from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. FIX: Inizializzazione corretta dell'SDK usando la tua chiave
const aiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(aiKey);

const server = http.createServer(async (req, res) => {
  // Gestione CORS nativa per far comunicare il frontend con Render
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 2. FIX: Accettiamo le richieste sulla radice "/" inviate dal tuo frontend
  if (req.method === "POST" && (req.url === "/" || req.url === "/api/outfit" || req.url === "/generate")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        console.log("Dati ricevuti dal frontend:", body);
        const { god, outfitDetails } = JSON.parse(body);

        // Estrazione sicura delle stringhe dell'outfit
        const cleanOutfitForAI = {
          top: outfitDetails?.top?.name || "Top generico",
          bottom: outfitDetails?.bottom?.name || "Bottom generico",
          accessory: outfitDetails?.accessory?.name || "Accessorio",
          shoes: outfitDetails?.shoes?.name || "Scarpe",
        };

        const systemInstruction = `Sei uno stylist streetwear esperto, segui creator come @hellacreps , @kwadwo.7 , @dnieccio , @nandax e @jayyals.
                Spiega perché l'outfit scelto è perfetto e rispechi il Dio ${god}. 
                Usa termini come 'puff print', 'oversize fit', 'stacking'. 
                non esagerare troppo con le parole e non essere troppo entusiasta.massimo 200-300 caratteri`;

        // 3. Manteniamo il modello "gemini-flash-latest" che avevi impostato tu
       const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest", // <-- Sostituisci con questo
  systemInstruction: systemInstruction,
});

        const prompt = `Analizza questo outfit per ${god}: ${JSON.stringify(cleanOutfitForAI)}.`;

        console.log("Inviando richiesta a Gemini...");
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("✅ Risposta ricevuta da Gemini!");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ text: responseText }));
      } catch (error) {
        console.error("❌ Errore Server:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            text: "Errore nel generare il consiglio dello stylist.",
          }),
        );
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Rotta non trovata");
  }
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server Streetwear attivo sulla porta ${PORT}`);
});
