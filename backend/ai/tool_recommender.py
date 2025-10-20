"""
AI Tool Recommender for OptiAI
Provides AI-powered tool recommendations based on natural language queries
"""

import json
import logging
import re
from typing import Dict, List, Optional
from datetime import datetime

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.warning("requests library not available. Tool recommender will use fallback mode.")

logger = logging.getLogger(__name__)

class ToolRecommender:
    """AI-powered tool recommendation system"""
    
    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token
        self.github_api_base = "https://api.github.com"
        
        # Curated tool database as fallback
        self.curated_tools = {
            "video editor": [
                {
                    "name": "OpenShot",
                    "description": "Free, open-source video editor for Linux, Mac, and Windows",
                    "url": "https://github.com/OpenShot/openshot-qt",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Download from GitHub releases or package manager"
                    }
                },
                {
                    "name": "DaVinci Resolve",
                    "description": "Professional video editing and color correction software",
                    "url": "https://www.blackmagicdesign.com/products/davinciresolve",
                    "type": "web",
                    "risk": "low",
                    "install": {
                        "description": "Download from official website"
                    }
                }
            ],
            "image editor": [
                {
                    "name": "GIMP",
                    "description": "GNU Image Manipulation Program - free alternative to Photoshop",
                    "url": "https://github.com/GNOME/gimp",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Available in most package managers"
                    }
                },
                {
                    "name": "Krita",
                    "description": "Digital painting and illustration software",
                    "url": "https://github.com/KDE/krita",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Download from official website or package manager"
                    }
                }
            ],
            "text editor": [
                {
                    "name": "VS Code",
                    "description": "Free source-code editor made by Microsoft",
                    "url": "https://github.com/microsoft/vscode",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Download from official website"
                    }
                },
                {
                    "name": "Sublime Text",
                    "description": "Sophisticated text editor for code, markup and prose",
                    "url": "https://www.sublimetext.com/",
                    "type": "web",
                    "risk": "low",
                    "install": {
                        "description": "Download from official website"
                    }
                }
            ],
            "file manager": [
                {
                    "name": "Ranger",
                    "description": "Console file manager with VI key bindings",
                    "url": "https://github.com/ranger/ranger",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "pip install ranger-fm or package manager"
                    }
                },
                {
                    "name": "Double Commander",
                    "description": "Cross-platform file manager with two panels",
                    "url": "https://github.com/doublecmd/doublecmd",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Download from GitHub releases"
                    }
                }
            ],
            "duplicate finder": [
                {
                    "name": "Czkawka",
                    "description": "Fast duplicate file finder written in Rust",
                    "url": "https://github.com/qarmin/czkawka",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Download from GitHub releases"
                    }
                },
                {
                    "name": "dupeGuru",
                    "description": "Duplicate file finder with fuzzy matching",
                    "url": "https://github.com/arsenetar/dupeguru",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Download from GitHub releases"
                    }
                }
            ],
            "system monitor": [
                {
                    "name": "htop",
                    "description": "Interactive process viewer and system monitor",
                    "url": "https://github.com/htop-dev/htop",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Available in most package managers"
                    }
                },
                {
                    "name": "btop",
                    "description": "Modern system monitor with beautiful interface",
                    "url": "https://github.com/aristocratos/btop",
                    "type": "github",
                    "risk": "low",
                    "install": {
                        "description": "Download from GitHub releases"
                    }
                }
            ]
        }
    
    def parse_query(self, query: str) -> List[str]:
        """Extract keywords from user query"""
        try:
            # Convert to lowercase and remove special characters
            clean_query = re.sub(r'[^\w\s]', ' ', query.lower())
            
            # Split into words and remove common stop words
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
            
            words = [word for word in clean_query.split() if word not in stop_words and len(word) > 2]
            
            # Add common synonyms and related terms
            synonyms = {
                'edit': ['editor', 'editing'],
                'video': ['movie', 'film', 'clip'],
                'image': ['picture', 'photo', 'graphic'],
                'text': ['code', 'script', 'document'],
                'file': ['files', 'folder', 'directory'],
                'duplicate': ['dupes', 'duplicates', 'copy'],
                'monitor': ['monitoring', 'system', 'performance'],
                'clean': ['cleanup', 'cleaner', 'optimize'],
                'compress': ['compression', 'zip', 'archive']
            }
            
            expanded_words = set(words)
            for word in words:
                if word in synonyms:
                    expanded_words.update(synonyms[word])
            
            return list(expanded_words)
            
        except Exception as e:
            logger.error(f"Error parsing query: {e}")
            return [query.lower()]
    
    def search_github_api(self, keywords: List[str], limit: int = 10) -> List[Dict]:
        """Search GitHub API for repositories matching keywords"""
        if not REQUESTS_AVAILABLE or not keywords:
            return []
        
        try:
            # Create search query
            search_query = " ".join(keywords[:5])  # Limit to 5 keywords
            search_query += " language:python OR language:javascript OR language:rust OR language:go"
            
            # Prepare headers
            headers = {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "OptiAI-ToolRecommender/1.0"
            }
            
            if self.github_token:
                headers["Authorization"] = f"token {self.github_token}"
            
            # Search repositories
            params = {
                "q": search_query,
                "sort": "stars",
                "order": "desc",
                "per_page": limit
            }
            
            response = requests.get(
                f"{self.github_api_base}/search/repositories",
                headers=headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                repositories = []
                
                for repo in data.get("items", []):
                    # Filter out very large repositories (likely frameworks)
                    if repo.get("size", 0) > 100000:  # > 100MB
                        continue
                    
                    # Determine risk level based on stars and forks
                    stars = repo.get("stargazers_count", 0)
                    forks = repo.get("forks_count", 0)
                    
                    if stars > 1000 and forks > 100:
                        risk = "low"
                    elif stars > 100:
                        risk = "medium"
                    else:
                        risk = "high"
                    
                    repositories.append({
                        "name": repo.get("name"),
                        "description": repo.get("description", "No description available"),
                        "url": repo.get("html_url"),
                        "type": "github",
                        "risk": risk,
                        "stars": stars,
                        "forks": forks,
                        "language": repo.get("language", "Unknown"),
                        "install": {
                            "description": f"Clone from GitHub: {repo.get('clone_url')}"
                        }
                    })
                
                return repositories
            else:
                logger.warning(f"GitHub API returned status {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error searching GitHub API: {e}")
            return []
    
    def search_curated_tools(self, keywords: List[str]) -> List[Dict]:
        """Search curated tool database"""
        try:
            suggestions = []
            
            for keyword in keywords:
                for category, tools in self.curated_tools.items():
                    if keyword in category or any(keyword in tool["name"].lower() or keyword in tool["description"].lower() for tool in tools):
                        suggestions.extend(tools)
            
            # Remove duplicates and limit results
            seen_urls = set()
            unique_suggestions = []
            
            for suggestion in suggestions:
                if suggestion["url"] not in seen_urls:
                    seen_urls.add(suggestion["url"])
                    unique_suggestions.append(suggestion)
            
            return unique_suggestions[:10]  # Limit to 10 suggestions
            
        except Exception as e:
            logger.error(f"Error searching curated tools: {e}")
            return []
    
    def enhance_with_llm(self, suggestions: List[Dict], query: str) -> List[Dict]:
        """Enhance suggestions using LLM if available"""
        # This would integrate with the existing OllamaManager
        # For now, return suggestions as-is
        return suggestions
    
    def get_tool_suggestions(self, query: str) -> Dict:
        """Get tool suggestions based on user query"""
        try:
            if not query or not query.strip():
                return {
                    "success": False,
                    "error": "Query cannot be empty"
                }
            
            # Parse query to extract keywords
            keywords = self.parse_query(query)
            logger.info(f"Parsed keywords from '{query}': {keywords}")
            
            # Search GitHub API
            github_suggestions = self.search_github_api(keywords)
            
            # Search curated tools
            curated_suggestions = self.search_curated_tools(keywords)
            
            # Combine and deduplicate suggestions
            all_suggestions = []
            seen_urls = set()
            
            # Add GitHub suggestions first (they're more dynamic)
            for suggestion in github_suggestions:
                if suggestion["url"] not in seen_urls:
                    seen_urls.add(suggestion["url"])
                    all_suggestions.append(suggestion)
            
            # Add curated suggestions
            for suggestion in curated_suggestions:
                if suggestion["url"] not in seen_urls:
                    seen_urls.add(suggestion["url"])
                    all_suggestions.append(suggestion)
            
            # Enhance with LLM if available
            enhanced_suggestions = self.enhance_with_llm(all_suggestions, query)
            
            # Limit to top 8 suggestions
            final_suggestions = enhanced_suggestions[:8]
            
            return {
                "success": True,
                "suggestions": final_suggestions,
                "query": query,
                "keywords": keywords,
                "total_found": len(final_suggestions),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting tool suggestions: {e}")
            return {
                "success": False,
                "error": str(e),
                "suggestions": []
            }
    
    def get_popular_tools(self) -> List[Dict]:
        """Get list of popular tools"""
        try:
            popular = []
            
            # Get popular tools from each category
            for category, tools in self.curated_tools.items():
                popular.extend(tools[:2])  # Top 2 from each category
            
            return popular[:12]  # Limit to 12 total
            
        except Exception as e:
            logger.error(f"Error getting popular tools: {e}")
            return []
    
    def get_tool_categories(self) -> List[str]:
        """Get list of available tool categories"""
        return list(self.curated_tools.keys())
