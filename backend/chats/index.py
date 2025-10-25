import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Chat operations - create chat, get user chats
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with chats data
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
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        user_id = params.get('user_id')
        
        if user_id:
            cur.execute("""
                SELECT c.*, 
                       CASE 
                         WHEN c.user1_id = %s THEN u2.username
                         ELSE u1.username
                       END as contact_name,
                       CASE 
                         WHEN c.user1_id = %s THEN u2.avatar_url
                         ELSE u1.avatar_url
                       END as contact_avatar,
                       CASE 
                         WHEN c.user1_id = %s THEN c.user2_id
                         ELSE c.user1_id
                       END as contact_id,
                       CASE 
                         WHEN c.user1_id = %s THEN u2.is_online
                         ELSE u1.is_online
                       END as contact_is_online,
                       CASE 
                         WHEN c.user1_id = %s THEN u2.last_seen
                         ELSE u1.last_seen
                       END as contact_last_seen
                FROM chats c
                JOIN users u1 ON c.user1_id = u1.id
                JOIN users u2 ON c.user2_id = u2.id
                WHERE c.user1_id = %s OR c.user2_id = %s
                ORDER BY c.created_at DESC
            """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id))
            chats = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps([dict(chat) for chat in chats], default=str)
            }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        user1_id = body_data.get('user1_id')
        user2_id = body_data.get('user2_id')
        
        cur.execute(
            "SELECT * FROM chats WHERE (user1_id = %s AND user2_id = %s) OR (user1_id = %s AND user2_id = %s)",
            (user1_id, user2_id, user2_id, user1_id)
        )
        existing_chat = cur.fetchone()
        
        if existing_chat:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps(dict(existing_chat), default=str)
            }
        
        cur.execute(
            "INSERT INTO chats (user1_id, user2_id) VALUES (%s, %s) RETURNING *",
            (user1_id, user2_id)
        )
        chat = cur.fetchone()
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
            'body': json.dumps(dict(chat), default=str)
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