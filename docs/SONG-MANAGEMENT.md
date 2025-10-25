# 🎵 Song Management Guide

## Manager App - Songs Tab

The Manager App now includes a **Songs** tab where you can manage your entire catalog without touching code or Firebase Console!

---

## Features

### ✅ Add New Songs
1. Open Manager App
2. Tap the **Songs** tab
3. Tap **"+ Add New Song"** button
4. Enter:
   - Song Title
   - Artist Name
   - Price (default $5)
5. Tap **"Add Song"**
6. Song appears in catalog immediately!

### ✅ Edit Songs
1. Go to **Songs** tab
2. Find the song you want to edit
3. Tap **"✎ Edit"** button
4. Update title, artist, or price
5. Tap **"Update Song"**
6. Changes sync instantly to all apps!

### ✅ Delete Songs
1. Go to **Songs** tab
2. Find the song to remove
3. Tap **"✕ Delete"** button
4. Confirm deletion
5. Song removed from catalog

---

## How It Works

### Real-Time Syncing
- When Manager adds/edits/deletes a song, it updates Firebase
- Customer App automatically refreshes the song list
- No app restart needed - changes appear instantly!

### Song Data Structure
Each song has:
- **ID**: Unique identifier (auto-generated)
- **Title**: Song name
- **Artist**: Artist/band name
- **Price**: Base request price

---

## Initial Setup

### Option 1: Start Empty (Recommended)
1. Import the `firebase-sample-data.json` (has no songs)
2. Open Manager App
3. Add your band's songs one by one
4. Customize prices as needed

### Option 2: Bulk Import
1. Create a JSON file with your songs:
````json
{
  "songs": {
    "song_001": {
      "id": "song_001",
      "title": "Your Song Title",
      "artist": "Artist Name",
      "price": 5
    }
  }
}
````
2. Import to Firebase Console
3. Songs appear in all apps immediately

---

## Best Practices

### Song Titles
- Use proper capitalization: "Boot Scootin' Boogie"
- Include apostrophes and punctuation
- Be consistent with formatting

### Artist Names
- Use full artist names: "Brooks & Dunn" not "B&D"
- For traditional songs, use "Traditional"
- For covers, use the original artist or "Various"

### Pricing
- Set a standard base price (e.g., $5)
- Popular songs can be priced higher
- Difficult/long songs can be priced higher
- Priority boost is separate and adjustable

### Organization
- Keep catalog up-to-date
- Remove songs the band no longer plays
- Add new songs as you learn them
- Songs display alphabetically in Customer App

---

## Tips for Band Managers

### Before a Gig
1. Review song list in Manager App
2. Remove any songs band isn't prepared to play
3. Adjust prices if needed
4. Set priority boost price for the event

### During a Gig
1. Use **Pending** tab to confirm payments
2. Use **Confirmed** tab to see paid queue
3. Use **Songs** tab to add audience requests on the fly

### After a Gig
1. Review which songs were requested most
2. Consider adjusting prices based on popularity
3. Add any requested songs to practice for next time

---

## Troubleshooting

### "Song not appearing in Customer App"
- Check that song was saved successfully
- Customer may need to pull-to-refresh the song list
- Check Firebase Console to verify song exists

### "Can't delete a song"
- Make sure you're in the Manager App (not Customer or Band Leader)
- Check internet connection
- Verify Firebase rules allow write access to songs

### "Song prices not updating"
- Edit the song and save again
- Check that price is a valid number
- Verify changes in Firebase Console

---

## Security Note

Currently, the songs database allows public write access so the Manager App can function without authentication. This means:

✅ **Acceptable for private events** where only trusted people have Manager App
⚠️ **Not recommended if** Manager App is publicly distributed

### To Secure (Optional):
Add Firebase Authentication to Manager App and update rules:
````json
"songs": {
  ".read": true,
  ".write": "auth != null"
}
````

For your use case (private band events), current setup is fine!

---

## Summary

✅ No more coding song lists  
✅ No more Firebase Console editing  
✅ Real-time updates across all apps  
✅ Easy to add/edit/delete songs  
✅ Manager has full control from their phone  

**Just open the Manager App and manage your setlist like a pro!** 🎸
