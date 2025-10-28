import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  LinearProgress
} from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

function StatCard({ title, value, subtitle, icon, trend, progress, color = 'primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box className="flex justify-between mb-2">
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          {icon && (
            <Box className={`text-${color}`}>
              {icon}
            </Box>
          )}
        </Box>
        
        <Typography variant="h5" component="div" className="font-bold mb-1">
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box className="flex items-center mt-2">
            <Box 
              component="span"
              className={`mr-1 ${trend.isPositive ? 'text-success' : 'text-error'}`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs last month
            </Typography>
          </Box>
        )}
        
        {progress !== undefined && (
          <Box className="mt-3">
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardsProps {
  stats: StatCardProps[];
}

export default function StatCards({ stats }: StatCardsProps) {
  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
}