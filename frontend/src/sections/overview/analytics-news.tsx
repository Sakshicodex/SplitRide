// frontend/src/sections/overview/analytics-news.tsx
import type { CardProps } from '@mui/material/Card';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

import { fToNow } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

// Define the shape of each news item inline
interface NewsItem {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  postedAt: string;
}

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: NewsItem[];
};

export function AnalyticsNews({ title, subheader, list, ...other }: Props) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 1 }} />

      <Scrollbar sx={{ height: 405 }}>
        <Box sx={{ display: 'grid', rowGap: 2, px: 2 }}>
          {list.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2,
                borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
              }}
            >
              <Avatar
                variant="rounded"
                alt={item.title}
                src={item.coverUrl}
                sx={{ width: 48, height: 48, flexShrink: 0 }}
              />

              <ListItemText
                primary={item.title}
                secondary={item.description}
                primaryTypographyProps={{ noWrap: true, typography: 'subtitle2' }}
                secondaryTypographyProps={{ mt: 0.5, noWrap: true, component: 'span' }}
              />

              <Box sx={{ flexShrink: 0, color: 'text.disabled', typography: 'caption' }}>
                {fToNow(item.postedAt)}
              </Box>
            </Box>
          ))}
        </Box>
      </Scrollbar>

      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} />}
        >
          View all
        </Button>
      </Box>
    </Card>
  );
}