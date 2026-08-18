export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        let body = req.body;

        if (!body || typeof body === "string") {

            let rawBody = "";

            for await (const chunk of req) {
                rawBody += chunk;
            }

            body = rawBody ? JSON.parse(rawBody) : {};
        }

        const eventId = body.event_id;
        const eventSourceUrl = body.event_source_url || "";
        const fbp = body.fbp || null;
        const fbc = body.fbc || null;

        if (!eventId) {
            return res.status(400).json({
                error: "event_id is required",
                received_body: body
            });
        }

        const pixelId = process.env.META_PIXEL_ID;
        const accessToken = process.env.META_ACCESS_TOKEN;

        if (!pixelId || !accessToken) {
            return res.status(500).json({
                error: "Meta environment variables are missing"
            });
        }

        // Customer information for Meta matching
        const userData = {};

        if (fbp) {
            userData.fbp = fbp;
        }

        if (fbc) {
            userData.fbc = fbc;
        }

        const event = {
            event_name: "Subscribe",
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: "website",
            event_source_url: eventSourceUrl,
            user_data: userData
        };

        const response = await fetch(
            `https://graph.facebook.com/v25.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    data: [event],
                    test_event_code: "TEST2380"
                })
            }
        );

        const result = await response.json();

        console.log("Meta CAPI response:", result);

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Meta API error",
                meta: result
            });
        }

        return res.status(200).json({
            success: true,
            meta: result
        });

    } catch (error) {

        console.error("Meta CAPI Error:", error);

        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
}
