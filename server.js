import "dotenv/config";
import http from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const server = http.createServer(async (req, res) => {
  // Gestione CORS per permettere al tuo HTML di parlare con Node
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/outfit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { god, outfitDetails } = JSON.parse(body);

        const cleanOutfitForAI = {
          top: outfitDetails.top.name,
          bottom: outfitDetails.bottom.name,
          accessory: outfitDetails.accessory.name,
          shoes: outfitDetails.shoes.name,
        };

        // Istruzioni specifiche per lo stile streetwear
        const systemInstruction = `Sei uno stylist streetwear esperto, segui creator come @hellacreps e @kwadwo.7. 
                Spiega perché l'outfit scelto è perfetto e rispechi il Dio ${god}. 
                Usa termini come 'puff print', 'oversize fit', 'stacking'. 
                non esagerare troppo con le parole.`;

        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest", // Modello aggiornato e veloce
          systemInstruction: systemInstruction,
        });

        const prompt = `Analizza questo outfit per ${god}: ${JSON.stringify(cleanOutfitForAI)}. Aggiungi alla fine un link cliccabile a Google Immagini per il pezzo forte: ${cleanOutfitForAI.top}.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ text: responseText }));
      } catch (error) {
        console.error("Errore Server:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            text: "Errore nel generare il consiglio dello stylist.",
          }),
        );
      }
    });
  }
});

const PORT = process.env.PORT || 8000;

// Aggiungi "0.0.0.0" dentro il metodo listen
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server Streetwear attivo sulla porta ${PORT}`);
});
