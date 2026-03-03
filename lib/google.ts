import { google } from "googleapis";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// We attach a listener that fires whenever googleapis automatically refreshes the token behind the scenes
oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
        // We should ideally update the database here if a new refresh token is issued, but usually it's only issued on the first consent.
        // However, if the access_token changes, the googleapis client holds it in memory for this instance.
        // To persistently update the user, we would need the user's ID, which we can't easily pass into this global listener without a wrapper.
        // For our abstraction, we will manually orchestrate updates if needed, or rely on `setCredentials`.
    }
});

// Helper to get an authenticated Calendar client for a specific user
export async function getCalendarClient(userId: string) {
    await connectDB();
    const user = await User.findById(userId);
    if (!user || !user.googleTokens || !user.googleTokens.refresh_token) {
        throw new Error("User Google tokens not found");
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
        access_token: user.googleTokens.access_token,
        refresh_token: user.googleTokens.refresh_token,
        expiry_date: user.googleTokens.expiry_date,
    });

    // Automatically refresh and save if close to expiration (handled automatically by getting an access token if needed, but we intercept to save)
    try {
        const tokenInfo = await client.getAccessToken();
        const newCredentials = client.credentials;

        if (newCredentials.access_token !== user.googleTokens.access_token) {
            user.googleTokens.access_token = newCredentials.access_token;
            user.googleTokens.expiry_date = newCredentials.expiry_date;
            await user.save();
        }
    } catch (error) {
        console.error("Failed to refresh Google token:", error);
        throw new Error("Google authentication expired or revoked");
    }

    return google.calendar({ version: "v3", auth: client });
}

export function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // Force consent to guarantee we get a refresh token
        scope: ["https://www.googleapis.com/auth/calendar.events"],
    });
}

export async function getTokensFromCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function createCalendarEvent(userId: string, task: any) {
    try {
        const calendar = await getCalendarClient(userId);
        const event = {
            summary: `Task: ${task.title}`,
            description: task.description || "",
            start: {
                dateTime: new Date(task.dueDate).toISOString(),
                timeZone: "Asia/Kolkata",
            },
            end: {
                // Default to 1 hour duration
                dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(),
                timeZone: "Asia/Kolkata",
            },
        };

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
        });

        return response.data.id;
    } catch (error: any) {
        console.error("Error creating Calendar event:", error?.message || error);
        return null; // Don't crash task creation if Calendar fails
    }
}

export async function updateCalendarEvent(userId: string, eventId: string, task: any) {
    try {
        const calendar = await getCalendarClient(userId);
        const event = {
            summary: `Task: ${task.title}`,
            description: task.description || "",
            start: {
                dateTime: new Date(task.dueDate).toISOString(),
                timeZone: "Asia/Kolkata",
            },
            end: {
                dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(),
                timeZone: "Asia/Kolkata",
            },
        };

        await calendar.events.patch({
            calendarId: "primary",
            eventId: eventId,
            requestBody: event,
        });
    } catch (error: any) {
        console.error("Error updating Calendar event:", error?.message || error);
    }
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
    try {
        const calendar = await getCalendarClient(userId);
        await calendar.events.delete({
            calendarId: "primary",
            eventId: eventId,
        });
    } catch (error: any) {
        console.error("Error deleting Calendar event:", error?.message || error);
    }
}
