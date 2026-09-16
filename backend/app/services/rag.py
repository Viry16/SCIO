"""
RAG (Retrieval-Augmented Generation) Service
"""
from typing import List, Dict, Any, Optional, Tuple
from functools import lru_cache

from app.config import get_settings, CRITICAL_KEYWORDS
from app.services.vectordb import get_vectordb_service
from app.services.llm import get_llm_service
from app.services.gemini import get_gemini_service
from app.models import SourceDocument

settings = get_settings()


class RAGService:
    """Service for RAG operations - retrieval and generation."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self.vectordb = get_vectordb_service()
        self.llm = get_llm_service()
        self.gemini = get_gemini_service()
        self.top_k = settings.top_k_results
    
    def detect_critical_issue(self, text: str) -> bool:
        """
        Detect if the message contains critical issue keywords.
        
        Args:
            text: Input text to check
            
        Returns:
            True if critical keywords found
        """
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in CRITICAL_KEYWORDS)
    
    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None
    ) -> Tuple[str, List[SourceDocument]]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: User query
            top_k: Number of documents to retrieve
            
        Returns:
            Tuple of (combined context string, list of source documents)
        """
        k = top_k or self.top_k
        
        # Search vector database
        results = self.vectordb.search(query, top_k=k)
        
        # Build context and source documents
        context_parts = []
        sources = []
        
        for i, result in enumerate(results):
            content = result["content"]
            metadata = result["metadata"]
            score = result.get("relevance_score", 0.0)
            
            # Add to context
            context_parts.append(f"[Document {i+1}]\n{content}")
            
            # Build source reference
            source_name = metadata.get("source", "Unknown")
            if "category" in metadata:
                source_name = f"{source_name} ({metadata['category']})"
            
            sources.append(SourceDocument(
                content=content[:500] + "..." if len(content) > 500 else content,
                source=source_name,
                metadata=metadata,
                relevance_score=score
            ))
        
        context = "\n\n".join(context_parts) if context_parts else "No relevant information found in the knowledge base."
        
        return context, sources
    
    def generate_response(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        model: Optional[str] = None
    ) -> Tuple[str, List[SourceDocument], bool]:
        """
        Generate a RAG response for a query.
        
        Args:
            query: User query
            conversation_history: Previous conversation messages
            
        Returns:
            Tuple of (response text, source documents, is_critical)
        """
        # Check for critical issues
        is_critical = self.detect_critical_issue(query)
        
        # Retrieve relevant context
        context, sources = self.retrieve(query)
        
        # Generate response - use Gemini if model contains 'gemini' or Ollama is not available
        if (model and 'gemini' in model) or not self.llm.is_connected():
            response = self.gemini.generate(
                user_message=query,
                context=context,
                conversation_history=conversation_history,
                model=model
            )
        else:
            try:
                response = self.llm.generate(
                    user_message=query,
                    context=context,
                    conversation_history=conversation_history,
                    model=model
                )
            except Exception as e:
                print(f"Ollama call failed ({e}), falling back to Gemini...")
                response = self.gemini.generate(
                    user_message=query,
                    context=context,
                    conversation_history=conversation_history,
                    model=model
                )
        
        # Add critical warning if needed
        if is_critical:
            critical_warning = "\n\n⚠️ **CRITICAL ISSUE DETECTED**: This appears to be a serious issue. Please escalate immediately to the IT Security team or your supervisor."
            response = critical_warning + "\n\n" + response
        
        return response, sources, is_critical
    
    def add_learned_qa(
        self,
        question: str,
        answer: str,
        message_id: str
    ) -> bool:
        """
        Add a user-approved Q&A pair to the knowledge base.
        This allows the chatbot to learn from successful interactions.
        
        Args:
            question: The user's original question
            answer: The assistant's approved answer
            message_id: Unique ID of the message (for deduplication)
            
        Returns:
            True if successfully added
        """
        try:
            # Format the Q&A pair as a document
            document_content = f"""Question: {question}

Answer: {answer}"""
            
            metadata = {
                "source": "user_feedback",
                "category": "learned_qa",
                "question": question[:200],  # Store truncated question in metadata
                "type": "approved_answer",
                "message_id": message_id
            }
            
            # Generate unique ID based on message_id
            doc_id = f"learned_qa_{message_id}"
            
            # Add to vector database
            added = self.vectordb.add_documents(
                documents=[document_content],
                metadatas=[metadata],
                ids=[doc_id]
            )
            
            print(f"✓ Learned Q&A pair added to knowledge base (ID: {doc_id})")
            return added > 0
            
        except Exception as e:
            print(f"✗ Failed to add learned Q&A: {e}")
            return False
    
    def generate_response_stream(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        model: Optional[str] = None
    ):
        """
        Generate a streaming RAG response.
        
        Args:
            query: User query
            conversation_history: Previous messages
            
        Yields:
            Response chunks
        """
        # Check for critical issues
        is_critical = self.detect_critical_issue(query)
        
        # Retrieve context
        context, sources = self.retrieve(query)
        
        # Yield critical warning first if needed
        if is_critical:
            yield "⚠️ **CRITICAL ISSUE DETECTED**: This appears to be a serious issue. Please escalate immediately to the IT Security team or your supervisor.\n\n"
        
        # Stream response
        for chunk in self.llm.generate_stream(
            user_message=query,
            context=context,
            conversation_history=conversation_history,
            model=model
        ):
            yield chunk
        
        # Return sources and critical status for the caller
        return sources, is_critical


@lru_cache()
def get_rag_service() -> RAGService:
    """Get cached RAG service instance."""
    return RAGService()
