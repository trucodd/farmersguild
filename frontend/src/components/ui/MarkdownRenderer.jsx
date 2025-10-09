const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    if (!text) return ''
    
    // Process the entire text at once
    let processed = text
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2 mt-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-2 mt-4">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-3 mt-4">$1</h1>')
      // Bold (process first)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic (process after bold)
      .replace(/\*([^*\n]+?)\*/g, '<em class="italic">$1</em>')
      // Code
      .replace(/`([^`]+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br>')
    
    // Handle bullet points
    processed = processed.replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    processed = processed.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc ml-4 space-y-1 mb-2">$1</ul>')
    
    // Wrap in paragraphs if not already wrapped
    if (!processed.startsWith('<')) {
      processed = `<p class="mb-2">${processed}</p>`
    }
    
    return processed
  }

  return (
    <div 
      className="markdown-content text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

export default MarkdownRenderer