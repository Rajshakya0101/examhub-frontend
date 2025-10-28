import { ReactNode, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  IconButton, 
  Menu, 
  MenuItem,
  Box,
  Typography,
  Divider
} from '@mui/material';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number | string;
  menuOptions?: string[];
  onMenuSelect?: (option: string) => void;
  footer?: ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  height = 300,
  menuOptions,
  onMenuSelect,
  footer
}: ChartCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleMenuSelect = (option: string) => {
    handleCloseMenu();
    if (onMenuSelect) {
      onMenuSelect(option);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant="h6" className="font-bold">
            {title}
          </Typography>
        }
        subheader={subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        action={menuOptions && (
          <>
            <IconButton
              onClick={handleOpenMenu}
              size="small"
              aria-label="Chart options"
            >
              ⋮
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              {menuOptions.map((option) => (
                <MenuItem 
                  key={option} 
                  onClick={() => handleMenuSelect(option)}
                >
                  {option}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      />
      
      <CardContent>
        <Box style={{ height }} className="flex items-center justify-center">
          {children}
        </Box>
      </CardContent>
      
      {footer && (
        <>
          <Divider />
          <Box className="p-4">
            {footer}
          </Box>
        </>
      )}
    </Card>
  );
}