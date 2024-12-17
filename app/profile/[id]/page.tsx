'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { CommentDialog } from '@/components/timeline/CommentDialog';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchFigureProfile, fetchFigurePosts } from '@/lib/api/figures';
import { fetchPostComments, addComment } from '@/lib/api/interactions';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { HistoricalFigure, HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';

// Rest of the file remains the same...