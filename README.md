# Music ATN

Expo + React Native starter that searches the live Apple Music catalog. It keeps the Apple private key on a small Node.js token server; the mobile app receives only a short-lived developer token.

## Apple credentials

1. In the Apple Developer portal, create a MusicKit key and note the Key ID and Team ID. Download the `.p8` private key once and store it securely.
2. Copy `server/.env.example` to `server/.env`, then fill in the credentials. Never commit `server/.env` or place the private key in the React Native app.
3. Run the token service:

   ```sh
   cd server
   npm install
   npm start
   ```

4. In the repository root, create `.env` for Expo. Set `EXPO_PUBLIC_API_URL` to the reachable URL for the token service (for an emulator, use the host machine's LAN address rather than `localhost`). Optionally set `EXPO_PUBLIC_APPLE_MUSIC_STOREFRONT` such as `us`, `gb`, or `mx`.
5. Install and start the Expo app:

   ```sh
   npm install
   npx expo start
   ```

The app searches Apple Music's public catalog and can open a result in Apple Music. The server signs ES256 developer tokens for 30 days and rate-limits the token endpoint. Deploy the token service over HTTPS before using it outside local development.

## Current scope

This starter provides real Apple Music catalog search. Full subscriber playback, user-library access, playlists, and user authorization require a native MusicKit integration and appropriate Apple Music user permission/subscription; they are not implemented by the catalog REST API alone. Expo Go does not include that native integration, so full playback will require a compatible native module or an Expo development build.
