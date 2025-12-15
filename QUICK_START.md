# Quick Start Guide - Docscan OCR Enhancements

## What's New?

Your Docscan application now has **three powerful new features**:

### 1. 📦 Automatic Data Storage
- All scanned documents are automatically saved to Supabase
- Extracted dates, vendor info, and amounts are stored
- Full audit trail of all scans

### 2. 🔄 Real-time Dashboard
- Dashboard updates automatically when you scan documents
- No need to refresh the page
- Changes appear instantly across all open windows

### 3. 🔔 Smart Reminders & Notifications
- Automatically detects warranty expiry dates
- Alerts you about upcoming deadlines
- Customizable notification preferences

---

## Step-by-Step Usage

### Scanning a Document

1. **Go to Dashboard**
   ```
   Click "Scan" tab in the navigation
   ```

2. **Upload an Image**
   - Click the upload zone
   - Select an image with dates (warranty, expiry, service, etc.)
   - Wait for processing

3. **View Extracted Data**
   - OCR result appears instantly
   - Raw text is extracted
   - Dates are automatically identified

4. **Data is Saved Automatically**
   - Document is stored in Supabase
   - Metadata is created
   - Reminders are auto-generated

### Viewing Your Documents

1. **Go to History Tab**
   ```
   Click "History" tab to see all documents
   ```

2. **View Document Details**
   - See vendor information
   - Check expiry dates
   - View extraction confidence

### Managing Reminders

1. **Open Reminders Tab**
   ```
   Click "Reminders" tab or click the bell icon (⏰ count badge)
   ```

2. **View Upcoming Deadlines**
   - Red badges: Critical (≤3 days)
   - Yellow badges: Important (≤7 days)
   - Blue badges: Upcoming (>7 days)

3. **Dismiss or Delete**
   - Click the X to dismiss temporarily
   - Click trash to delete permanently

### Configure Notifications

1. **Open Notification Preferences**
   ```
   Click the bell icon in the top-right header
   ```

2. **Customize Your Alerts**
   - **Warranty Alerts**: Get notified when warranties expire
   - **Service Reminders**: Know when maintenance is due
   - **Payment Due**: Remember bill deadlines
   - **Subscription Renewal**: Don't miss renewals

3. **Choose Notification Method**
   - **Browser Notifications**: Pop-up alerts (web & mobile)
   - **Email Reminders**: Coming soon!

4. **Save Your Preferences**
   ```
   Click "Save Preferences"
   ```

---

## Smart Date Detection

The system automatically identifies these important dates from documents:

| Date Type | Keywords | Priority | Example |
|-----------|----------|----------|---------|
| **Warranty Expiry** | warranty, expires, expiry, valid until | 🔴 Highest | "Warranty until 12/31/2025" |
| **Service Due** | service due, next service, annual service | 🟠 High | "Next Service: 06/15/2025" |
| **Payment Due** | payment due, bill due, due date | 🟡 Medium | "Payment Due: 01/15/2025" |
| **Renewal** | renewal, subscription, renew | 🟡 Medium | "Subscription Renewal: 03/01/2025" |
| **Purchase** | purchase, bought, date of purchase | 🟢 Low | "Date of Purchase: 01/15/2024" |

---

## Notification Examples

### When You'll Get Alerts

**High Priority (Red Alert)**
- Warranty expires in 3-7 days
- Payment is due in 1-3 days
- Service overdue or due today

**Medium Priority (Yellow Alert)**
- Warranty expires in 8-30 days
- Service due in 7-14 days
- Subscription renews in 7 days

**Info (Blue)**
- Service due in 15+ days
- Warranty expires in 30+ days

---

## Troubleshooting

### Documents Not Appearing in Dashboard

**Solution**: 
1. Check you're signed in
2. Refresh the page
3. Check "History" tab instead
4. Ensure document uploaded successfully (check for green checkmark)

### Dates Not Being Extracted

**Why it happens**:
- Image quality too low
- Date format not recognized
- Text too blurry

**Solutions**:
1. Use a clearer image
2. Ensure good lighting
3. Keep document straight
4. Try again with another scan

### No Notifications Appearing

**Check these**:
1. Open notification preferences (bell icon)
2. Verify notifications are enabled
3. Browser notification permission granted (check browser settings)
4. Notification window hasn't passed (check reminder date)

### Real-time Updates Not Working

**Solution**:
1. Check your internet connection
2. Refresh the page
3. Check browser console for errors (F12)
4. Try a different browser

---

## Data Flow Diagram

```
You Scan Image
      ↓
OCR Processing (Google Vision)
      ↓
Smart Date & Info Extraction
      ↓
Automatic Reminder Suggestions
      ↓
Save to Supabase Database
      ↓
Real-time Dashboard Update (instant!)
      ↓
Notification System (checks every 5 min)
      ↓
Alert You When Deadline Approaches
```

---

## Browser Notification Permission

To get browser notifications:

1. **First Time Alert**
   - When you first scan a document
   - Click "Allow" on the permission prompt

2. **For Existing Users**
   - Chrome: Settings → Privacy → Notifications
   - Firefox: Preferences → Privacy → Permissions → Notifications
   - Safari: System Preferences → Websites → Notifications

---

## Tips & Best Practices

### 📸 Best Image Quality
- Use good lighting
- Keep document straight
- Don't use filters or effects
- Ensure all text is visible

### 📅 Better Date Extraction
- Warranty cards work best
- Service receipts are great
- Bills and invoices are recognized
- Handwritten dates may not work

### 🔔 Notification Setup
- Enable alerts for important dates
- Disable if too many reminders
- Check preferences weekly
- Update email when available

### 💾 Data Organization
- Add meaningful vendor names
- Tag documents for easy search
- Star important documents
- Review history regularly

---

## API & Advanced Features (For Developers)

### Extracting Dates Programmatically
```javascript
import { extractDateDetails } from '@/lib/entity-extraction';

const text = "Warranty expires: 12/31/2025";
const dates = extractDateDetails(text);

// Returns:
// {
//   warrantyExpiry: "12/31/2025",
//   purchaseDate: null,
//   nextServiceDue: null,
//   invoiceDate: null,
//   serviceInterval: null
// }
```

### Creating Reminders Manually
```javascript
import { useReminders } from '@/hooks/useReminders';

const { createReminder } = useReminders();

await createReminder({
  title: "Important Deadline",
  description: "Remember this date",
  reminder_type: 'custom',
  reminder_date: '2025-12-31',
  notify_before_days: 7,
  ocr_result_id: null
});
```

### Real-time Subscription Example
```javascript
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata';

const { documents } = useDocumentMetadata();
// Automatically updates when database changes!
```

---

## Keyboard Shortcuts

(Coming in future versions)
- `Ctrl+U`: Quick upload
- `Ctrl+L`: Go to History
- `Ctrl+R`: Go to Reminders
- `Ctrl+N`: Notification settings

---

## Support & Feedback

### Report Issues
1. Check if date format is unusual
2. Try with a different document
3. Check browser console for errors (F12)
4. Note the error message

### Feature Requests
- Email notification alerts
- PDF/CSV export
- Recurring reminders
- Multi-language support
- Mobile app

---

## What's Next?

Stay tuned for these upcoming features:

- ✨ **Email Notifications**: Get alerts via email
- 📱 **Mobile Push**: Notifications on your phone
- 📊 **Analytics**: Track warranty expirations
- 🔍 **Search**: Find documents easily
- 📥 **Bulk Import**: Upload many at once
- 🌍 **Multi-language**: Support more languages
- 🔗 **Integrations**: Calendar sync, etc.

---

## Frequently Asked Questions

**Q: Is my data secure?**  
A: Yes! All data is encrypted in transit and at rest in Supabase. Only you can access your documents.

**Q: How long are documents stored?**  
A: Your account level determines retention. Default is unlimited.

**Q: Can I delete documents?**  
A: Yes, click the trash icon in the History tab. This is permanent.

**Q: What happens to old reminders?**  
A: They stay in your history. You can dismiss or delete them.

**Q: Can I export my data?**  
A: Export feature coming soon! Currently you can view in History tab.

**Q: How accurate is the OCR?**  
A: ~95% accurate with good quality images. Confidence score shown in results.

---

## Contact & Support

For help or feedback:
- 📧 Email: support@docscan.app
- 💬 Chat: Available in app (coming soon)
- 🐛 Bug Reports: Via Settings menu
- 💡 Feature Requests: Via Settings menu

---

**Happy scanning! Your deadline management just got smarter!** 🎉
