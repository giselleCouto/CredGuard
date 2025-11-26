"""
Setup configuration for CredGuard Python SDK
"""
from setuptools import setup, find_packages
from pathlib import Path

# Read README.md for long description
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding='utf-8')

setup(
    name="credguard-sdk",
    version="1.0.0",
    author="CredGuard Team",
    author_email="support@credguard.com",
    description="SDK oficial para integração com CredGuard API - Plataforma de Credit Scoring com Machine Learning",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/giselleCouto/CredGuard",
    project_urls={
        "Bug Tracker": "https://github.com/giselleCouto/CredGuard/issues",
        "Documentation": "https://credguard.manus.space/api/docs",
        "Source Code": "https://github.com/giselleCouto/CredGuard",
    },
    packages=find_packages(exclude=["tests", "tests.*", "examples", "examples.*"]),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Office/Business :: Financial",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
        "Typing :: Typed",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.31.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.7.0",
            "mypy>=1.5.0",
            "flake8>=6.1.0",
        ],
    },
    keywords=[
        "credguard",
        "credit scoring",
        "machine learning",
        "mlops",
        "fintech",
        "credit risk",
        "api client",
        "sdk",
    ],
    license="MIT",
    zip_safe=False,
    include_package_data=True,
)
