import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, platformSettingsTable, websitesTable } from "@workspace/db";
import {
  GetPublicWebsiteParams,
  GetPublicWebsiteResponse,
  GetPublicWhatsappResponse,
} from "@workspace/api-zod";
import { getMetaGraphVersion } from "../lib/meta";

const router: IRouter = Router();

router.get("/public/settings/whatsapp", async (_req, res): Promise<void> => {
  const settings = await db
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.key, "whatsapp_number"));
  const frontend = await db
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.key, "frontend_url"));

  let whatsappNumber = settings[0]?.value || process.env.VITE_WHATSAPP_NUMBER || "";
  if (!whatsappNumber && process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID) {
    const response = await fetch(
      `https://graph.facebook.com/${getMetaGraphVersion()}/${encodeURIComponent(process.env.META_PHONE_NUMBER_ID)}?fields=display_phone_number`,
      { headers: { Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}` } },
    );
    if (response.ok) {
      const meta = (await response.json()) as { display_phone_number?: string };
      whatsappNumber = meta.display_phone_number || "";
    }
  }

  const data = GetPublicWhatsappResponse.parse({
    whatsappNumber,
    frontendUrl: frontend[0]?.value || process.env.FRONTEND_URL || "http://localhost",
  });
  res.json(data);
});

router.get("/public/websites/:publicId", async (req, res): Promise<void> => {
  const params = GetPublicWebsiteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [website] = await db
    .select()
    .from(websitesTable)
    .where(eq(websitesTable.publicId, params.data.publicId));
  if (!website) {
    res.status(404).json({ error: "Website not found" });
    return;
  }

  res.json(
    GetPublicWebsiteResponse.parse({
      ...website,
      publicId: website.publicId.toString(),
      jsonStructure: website.jsonStructure,
      showBranding: website.showBranding,
    }),
  );
});

export default router;