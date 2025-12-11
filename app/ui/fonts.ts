import { Inter, Lusitana } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });

// This is the part you are likely missing or have written incorrectly:
export const lusitana = Lusitana({
  weight: ['400', '700'],
  subsets: ['latin'],
});