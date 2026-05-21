# Firebase Rules Notes

The production Firestore rules live at the repository root in `firestore.rules`.

Firebase Storage is intentionally not used in this build. Media files are uploaded
to Cloudinary through unsigned upload presets, and only metadata is saved in
Cloud Firestore.
