"""
Modelos de dados para autenticação e jobs
"""
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sqlite3
import os

DATABASE_PATH = 'credguard.db'


def get_db_connection():
    """Cria conexão com banco de dados SQLite."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inicializa o banco de dados com as tabelas necessárias."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tabela de usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabela de jobs (associados aos usuários)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id TEXT UNIQUE NOT NULL,
            filename TEXT NOT NULL,
            product TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Banco de dados inicializado")


class User(UserMixin):
    """Modelo de usuário para Flask-Login."""
    
    def __init__(self, id, username, email, password_hash):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
    
    @staticmethod
    def create(username, email, password):
        """Cria um novo usuário no banco de dados."""
        password_hash = generate_password_hash(password)
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                (username, email, password_hash)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            
            return User(user_id, username, email, password_hash)
        except sqlite3.IntegrityError:
            return None  # Usuário já existe
    
    @staticmethod
    def get_by_id(user_id):
        """Busca usuário por ID."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(row['id'], row['username'], row['email'], row['password_hash'])
        return None
    
    @staticmethod
    def get_by_username(username):
        """Busca usuário por username."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(row['id'], row['username'], row['email'], row['password_hash'])
        return None
    
    @staticmethod
    def get_by_email(email):
        """Busca usuário por email."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(row['id'], row['username'], row['email'], row['password_hash'])
        return None
    
    def check_password(self, password):
        """Verifica se a senha está correta."""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'


class Job:
    """Modelo de job associado a um usuário."""
    
    @staticmethod
    def create(user_id, job_id, filename, product, status):
        """Cria um novo job no banco de dados."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO jobs (user_id, job_id, filename, product, status) VALUES (?, ?, ?, ?, ?)',
            (user_id, job_id, filename, product, status)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def update_status(job_id, status):
        """Atualiza o status de um job."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE jobs SET status = ? WHERE job_id = ?',
            (status, job_id)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_by_user(user_id):
        """Retorna todos os jobs de um usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    @staticmethod
    def get_by_job_id(job_id):
        """Busca job por job_id."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM jobs WHERE job_id = ?', (job_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    @staticmethod
    def belongs_to_user(job_id, user_id):
        """Verifica se um job pertence a um usuário."""
        job = Job.get_by_job_id(job_id)
        return job and job['user_id'] == user_id
