# Environment Setup for Cloudinary Integration

## Required Environment Variables

To use the Cloudinary integration, you need to set up the following environment variables:

### 1. Create Environment File

Create a `.env` file in your project root with the following variables:

```bash
# Cloudinary Configuration
# Required: Your Cloudinary cloud name (public)
PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here

# Optional: API key for upload functionality (public)
PUBLIC_CLOUDINARY_API_KEY=your_api_key_here

# Optional: API secret for server-side operations (private)
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 2. Getting Your Cloudinary Credentials

1. **Sign up for Cloudinary**
   - Go to [https://cloudinary.com](https://cloudinary.com)
   - Create a free account (includes generous free tier)

2. **Access Your Dashboard**
   - Go to [https://cloudinary.com/console](https://cloudinary.com/console)
   - Your credentials will be displayed on the dashboard

3. **Copy Your Credentials**
   - **Cloud Name**: This is your unique identifier (required)
   - **API Key**: Used for client-side operations (optional)
   - **API Secret**: Used for server-side operations (optional, keep private)

### 3. Environment Variable Details

#### Required Variables

- **`PUBLIC_CLOUDINARY_CLOUD_NAME`**: Your Cloudinary cloud name
  - This is required for basic image delivery
  - Must be prefixed with `PUBLIC_` to be available in client-side code
  - Example: `demo` (if your cloud name is "demo")

#### Optional Variables

- **`PUBLIC_CLOUDINARY_API_KEY`**: Your API key
  - Required for upload functionality
  - Can be public (hence the `PUBLIC_` prefix)
  - Only needed if you plan to upload images from the frontend

- **`CLOUDINARY_API_SECRET`**: Your API secret
  - Required for server-side operations and uploads
  - Keep this private (no `PUBLIC_` prefix)
  - Only needed for advanced server-side functionality

### 4. Deployment Setup

#### Vercel

```bash
# Add environment variables in Vercel dashboard
vercel env add PUBLIC_CLOUDINARY_CLOUD_NAME
vercel env add PUBLIC_CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

#### Netlify

```bash
# Add in Netlify dashboard under Site settings > Environment variables
PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
PUBLIC_CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

#### Other Platforms

Add the environment variables through your hosting platform's dashboard or deployment configuration.

### 5. Validation

The integration includes automatic validation. If required variables are missing, you'll see helpful error messages:

```typescript
// This will throw an error if PUBLIC_CLOUDINARY_CLOUD_NAME is not set
import { validateCloudinaryConfig } from '~/utils/cloudinary';

const validation = validateCloudinaryConfig();
if (!validation.isValid) {
  console.error('Cloudinary configuration errors:', validation.errors);
}
```

### 6. Local Development

For local development:

1. Create `.env` file in project root
2. Add your Cloudinary credentials
3. Restart your development server
4. The integration will automatically use your credentials

### 7. Security Notes

- **Never commit** your `.env` file to version control
- **Keep API secrets private** - don't use `PUBLIC_` prefix for secrets
- **Use different credentials** for development and production if needed
- **Regularly rotate** your API secrets for security

### 8. Troubleshooting

#### Images Not Loading

- Check that `PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly
- Verify your cloud name matches your Cloudinary account
- Ensure environment variables are available in your deployment

#### Build Errors

- Make sure environment variables are set in your deployment platform
- Check that variable names match exactly (case-sensitive)
- Verify no typos in variable names

#### Upload Issues

- Ensure `PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set
- Check that your API credentials have the necessary permissions
- Verify your Cloudinary account limits haven't been exceeded

### 9. Free Tier Limits

Cloudinary's free tier includes:

- **25 GB** storage
- **25 GB** monthly bandwidth
- **1,000** transformations per month
- **1,000** images/videos

This is typically sufficient for most small to medium projects.

---

**Next Steps**: Once your environment variables are configured, your Cloudinary integration will be fully functional! 🎉
