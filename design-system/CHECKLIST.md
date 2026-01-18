# Pre-Build Checklist for Claude Code

Before building any new feature, Claude Code must:

1. ✅ Read design-system/DESIGN_GUIDE.md
2. ✅ Confirm the feature uses:
   - Purple gradient for primary buttons
   - Dark gradient OR white background (appropriate to context)
   - Consistent spacing (p-8 for cards, space-y-6 for forms)
   - Rounded corners (rounded-xl minimum)
   - Proper font sizes from the guide
3. ✅ Ensure mobile-first responsive design
4. ✅ Include hover states for all interactive elements
5. ✅ Add loading/error states where appropriate

## Quick Style Reference

**Auth/Marketing Pages:**
- Dark gradient background: `bg-gradient-to-br from-slate-900 to-slate-800`
- White centered card: `bg-white rounded-2xl shadow-xl p-8 max-w-md`

**Dashboard/App Pages:**
- Light background: `bg-slate-50`
- Content cards: `bg-white rounded-xl shadow-sm p-6 border border-slate-200`

**All Pages:**
- Primary button: Purple gradient, rounded-xl, px-8 py-3
- Input fields: Rounded-lg, border-slate-300, focus:ring-purple-600
- Emojis for icons: ✈️ 🏠 🍴 🎯 etc.
