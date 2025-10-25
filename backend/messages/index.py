import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Message operations - send, edit, delete, get messages
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with messages data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        chat_id = params.get('chat_id')
        
        if chat_id:
            cur.execute(
                "SELECT * FROM messages WHERE chat_id = %s ORDER BY created_at ASC",
                (chat_id,)
            )
            messages = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps([dict(msg) for msg in messages], default=str)
            }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        chat_id = body_data.get('chat_id')
        sender_id = body_data.get('sender_id')
        content = body_data.get('content', '')
        photo_url = body_data.get('photo_url')
        
        cur.execute(
            "INSERT INTO messages (chat_id, sender_id, content, photo_url) VALUES (%s, %s, %s, %s) RETURNING *",
            (chat_id, sender_id, content, photo_url)
        )
        message = cur.fetchone()
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
            'body': json.dumps(dict(message), default=str)
        }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        message_id = body_data.get('message_id')
        content = body_data.get('content')
        
        cur.execute(
            "UPDATE messages SET content = %s, is_edited = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
            (content, message_id)
        )
        message = cur.fetchone()
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
            'body': json.dumps(dict(message), default=str)
        }
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        message_id = params.get('message_id')
        
        cur.execute("DELETE FROM messages WHERE id = %s", (message_id,))
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
            'body': json.dumps({'success': True})
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
