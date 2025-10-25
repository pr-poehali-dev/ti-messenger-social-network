import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and registration
    Args: event - dict with httpMethod, body
          context - object with request_id
    Returns: HTTP response with user data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'register':
            username = body_data.get('username')
            password = body_data.get('password')
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            email = f"{username}@timessenger.local"
            
            cur.execute(
                "INSERT INTO users (username, email, password_hash, avatar_url, is_online) VALUES (%s, %s, %s, %s, TRUE) RETURNING id, username, email, avatar_url, is_online, last_seen",
                (username, email, password_hash, 'https://cdn.poehali.dev/files/76768b2e-6f03-4ed5-8c11-5e5cc160bb95.png')
            )
            user = cur.fetchone()
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps(dict(user), default=str)
            }
        
        elif action == 'login':
            username = body_data.get('username')
            password = body_data.get('password')
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(
                "UPDATE users SET is_online = TRUE, last_seen = CURRENT_TIMESTAMP WHERE username = %s AND password_hash = %s RETURNING id, username, email, avatar_url, is_online, last_seen",
                (username, password_hash)
            )
            user = cur.fetchone()
            conn.commit()
            
            cur.close()
            conn.close()
            
            if user:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps(dict(user), default=str)
                }
            else:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Invalid credentials'})
                }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }