import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';

export default function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { name: 'Features', href: '/features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Testimonials', href: '/testimonials' },
        { name: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Study Guides', href: '/resources/study-guides' },
        { name: 'Practice Tests', href: '/resources/practice-tests' },
        { name: 'Blog', href: '/blog' },
        { name: 'Tutorials', href: '/tutorials' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press', href: '/press' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'Security', href: '/security' },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.palette.mode === 'dark' 
          ? 'background.paper' 
          : 'grey.50',
        py: 6,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand and description */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 36, 
                height: 36, 
                mr: 1.5, 
                borderRadius: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16
              }}>
                EP
              </Box>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
                Exam Platform
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              The leading online platform for exam preparation, offering comprehensive practice tests,
              analytics, and personalized learning paths to help students achieve academic success.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <IconButton size="small" aria-label="Facebook">
                <FacebookIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Twitter">
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="LinkedIn">
                <LinkedInIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Instagram">
                <InstagramIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {/* Links */}
          {footerLinks.map((section) => (
            <Grid item xs={6} sm={3} md={2} key={section.title}>
              <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                {section.links.map((link) => (
                  <Box component="li" sx={{ py: 0.5 }} key={link.name}>
                    <Link
                      component={RouterLink}
                      to={link.href}
                      color="text.secondary"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                      }}
                    >
                      {link.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Bottom section */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} Exam Platform. All rights reserved.
          </Typography>

          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
            <Link 
              component={RouterLink} 
              to="/terms" 
              color="text.secondary"
              sx={{ 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              Terms
            </Link>
            <Link 
              component={RouterLink} 
              to="/privacy" 
              color="text.secondary"
              sx={{ 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              Privacy
            </Link>
            <Link 
              component={RouterLink} 
              to="/cookies" 
              color="text.secondary"
              sx={{ 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              Cookies
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}