import React from 'react';
import { Box, Container, Typography, Button, Grid, Stack } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

const Footer: React.FC = () => {
  const footerLinks = {
    product: [
      { name: 'Features', url: '#' },
      { name: 'Pricing', url: '#' },
      { name: 'Testimonials', url: '#' },
      { name: 'FAQ', url: '#' }
    ],
    company: [
      { name: 'About Us', url: '#' },
      { name: 'Careers', url: '#' },
      { name: 'Blog', url: '#' },
      { name: 'Press Kit', url: '#' }
    ],
    resources: [
      { name: 'Community', url: '#' },
      { name: 'Support', url: '#' },
      { name: 'Contact', url: '#' },
      { name: 'Privacy Policy', url: '#' }
    ],
  };
  
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
        py: 6,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #7c3aed 30%, #ec4899 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                ExamHub
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                ExamHub helps students and professionals practice for exams efficiently with personalized learning tools and comprehensive analytics.
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Contact Us
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    +1 (555) 123-4567
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    support@examhub.com
                  </Typography>
                </Box>
              </Stack>
            </Box>
            
            <Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <FacebookIcon fontSize="small" />
                </Button>
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <TwitterIcon fontSize="small" />
                </Button>
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <InstagramIcon fontSize="small" />
                </Button>
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <LinkedInIcon fontSize="small" />
                </Button>
              </Stack>
            </Box>
          </Grid>
          
          {/* Footer Link Columns */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                  Product
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.product.map((link, index) => (
                    <Button 
                      key={index}
                      component="a"
                      href={link.url}
                      color="inherit"
                      sx={{ 
                        justifyContent: 'flex-start', 
                        p: 0,
                        minWidth: 'auto',
                        fontWeight: 'normal',
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'transparent'
                        }
                      }}
                    >
                      {link.name}
                    </Button>
                  ))}
                </Stack>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                  Company
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.company.map((link, index) => (
                    <Button 
                      key={index}
                      component="a"
                      href={link.url}
                      color="inherit"
                      sx={{ 
                        justifyContent: 'flex-start', 
                        p: 0,
                        minWidth: 'auto',
                        fontWeight: 'normal',
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'transparent'
                        }
                      }}
                    >
                      {link.name}
                    </Button>
                  ))}
                </Stack>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                  Resources
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.resources.map((link, index) => (
                    <Button 
                      key={index}
                      component="a"
                      href={link.url}
                      color="inherit"
                      sx={{ 
                        justifyContent: 'flex-start', 
                        p: 0,
                        minWidth: 'auto',
                        fontWeight: 'normal',
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'transparent'
                        }
                      }}
                    >
                      {link.name}
                    </Button>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        <Box 
          sx={{ 
            pt: 4, 
            mt: 4, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 1, sm: 0 } }}>
            © {currentYear} ExamHub. All rights reserved.
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 3 }}
            alignItems="center"
          >
            <Button
              color="inherit"
              sx={{ 
                p: 0,
                minWidth: 'auto',
                fontWeight: 'normal',
                fontSize: '0.75rem',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Terms of Service
            </Button>
            <Button
              color="inherit"
              sx={{ 
                p: 0,
                minWidth: 'auto',
                fontWeight: 'normal',
                fontSize: '0.75rem',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Privacy Policy
            </Button>
            <Button
              color="inherit"
              sx={{ 
                p: 0,
                minWidth: 'auto',
                fontWeight: 'normal',
                fontSize: '0.75rem',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Cookie Policy
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;