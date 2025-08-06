import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  totalItems: number;
  className?: string;
}

export const ConversationPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  className
}: PaginationProps) => {
  
  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show</span>
        <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">items</span>
      </div>

      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="min-w-[2rem]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Hook for managing paginated conversations
interface UsePaginatedConversationsProps {
  conversations: any[];
  initialItemsPerPage?: number;
}

export const usePaginatedConversations = ({
  conversations,
  initialItemsPerPage = 20
}: UsePaginatedConversationsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(conversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConversations = conversations.slice(startIndex, endIndex);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Reset to first page when conversations change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [conversations.length, totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: conversations.length,
    currentConversations,
    handlePageChange,
    handleItemsPerPageChange,
    PaginationComponent: (props: { className?: string }) => (
      <ConversationPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={conversations.length}
        {...props}
      />
    )
  };
};

// Hook for managing paginated messages with virtual scrolling optimization
interface UsePaginatedMessagesProps {
  messages: any[];
  initialItemsPerPage?: number;
  enableVirtualScrolling?: boolean;
}

export const usePaginatedMessages = ({
  messages,
  initialItemsPerPage = 50,
  enableVirtualScrolling = true
}: UsePaginatedMessagesProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: initialItemsPerPage });

  const totalPages = Math.ceil(messages.length / itemsPerPage);
  
  // For large conversations, use virtual scrolling
  const shouldUseVirtualScrolling = enableVirtualScrolling && messages.length > 100;
  
  const getCurrentMessages = () => {
    if (shouldUseVirtualScrolling) {
      // Show recent messages by default, but allow pagination through older messages
      const recentMessages = messages.slice(-itemsPerPage);
      return recentMessages;
    } else {
      // Standard pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return messages.slice(startIndex, endIndex);
    }
  };

  const currentMessages = getCurrentMessages();

  // Auto-scroll to bottom for new messages
  const scrollToBottom = () => {
    if (shouldUseVirtualScrolling) {
      setCurrentPage(totalPages);
    }
  };

  // Load more messages (for infinite scroll pattern)
  const loadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const hasMore = currentPage < totalPages;

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: messages.length,
    currentMessages,
    hasMore,
    shouldUseVirtualScrolling,
    handlePageChange: setCurrentPage,
    handleItemsPerPageChange: setItemsPerPage,
    scrollToBottom,
    loadMore,
    PaginationComponent: (props: { className?: string }) => (
      <ConversationPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={messages.length}
        {...props}
      />
    )
  };
};