from langchain_openai import ChatOpenAI
from langchain.prompts import MessagesPlaceholder, HumanMessagePromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from sqlalchemy.orm import Session
from ..memory.crop_memory import PostgreSQLChatMessageHistory
from ..services.crop_context import CropContextService
from ..prompts.crop_prompts import CROP_SYSTEM_PROMPT
import os

class CropChatChain:
    def __init__(self, crop_id: int, db: Session):
        self.crop_id = crop_id
        self.db = db
        
        # Configure LLM for OpenRouter
        self.llm = ChatOpenAI(
            model="deepseek/deepseek-chat-v3.1:free",
            temperature=0.7,
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        )
        
        self.context_service = CropContextService(db)
        
        # Create PostgreSQL-backed memory for this specific crop
        chat_history = PostgreSQLChatMessageHistory(
            crop_id=crop_id,
            db=db
        )
        
        self.memory = ConversationBufferMemory(
            chat_memory=chat_history,
            memory_key="messages",
            return_messages=True
        )
        
        # Get crop context for system prompt
        context = self.context_service.get_crop_context(crop_id)
        formatted_context = self.context_service.format_context_for_ai(context)
        
        # Create prompt template with system message and conversation history
        system_message = CROP_SYSTEM_PROMPT.format(crop_context=formatted_context, chat_history="{chat_history}")
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{content}")
        ])
        
        # Create the chain using modern syntax
        self.chain = self.prompt | self.llm | StrOutputParser()
    
    def get_response(self, message: str) -> str:
        """Get AI response with full crop context and memory"""
        print(f"\n=== Crop {self.crop_id} Chat ===")
        print(f"User: {message}")
        
        # Store user message
        if hasattr(self.memory.chat_memory, 'add_user_message'):
            self.memory.chat_memory.add_user_message(message)
        
        # Get conversation history
        messages = self.memory.chat_memory.messages
        
        # Invoke the chain with modern syntax
        response = self.chain.invoke({
            "content": message,
            "messages": messages,
            "chat_history": "\n".join([f"{msg.type}: {msg.content}" for msg in messages[-10:]])  # Last 10 messages
        })
        
        # Store AI response
        if hasattr(self.memory.chat_memory, 'add_ai_message'):
            self.memory.chat_memory.add_ai_message(response)
        
        print(f"AI: {response}")
        print("=" * 50)
        
        return response