# %%
import requests
from bs4 import BeautifulSoup
import csv, os
import pandas as pd

# URL of the AAAI 2024 page on DBLP
url = "https://dblp.uni-trier.de/db/conf/aaai/aaai2024.html"


if os.path.exists("data/aaai2024.html"):
    with open("aaai2024.html", "r") as file:
        html_content = file.read()
        soup = BeautifulSoup(html_content, "html.parser")
else: 
    # Send an HTTP GET request
    response = requests.get(url)
    response.raise_for_status()  # Ensure the request was successful
    
    with open("aaai2024.html", "w") as f:
        f.write(response.text)

    # Parse HTML with BeautifulSoup
    soup = BeautifulSoup(response.text, "html.parser")

# %%
with open("aaai2024.html", "w") as f:
    f.write(response.text)

# %%
# Find all sections (div with class 'section' or header tags)
sections = soup.find_all(["h2", "h3", "h4"])  # Section headers (may vary)

# Prepare list to store extracted data
papers = []

current_section = "Unknown Section"  # Default section name

# Loop through elements and extract section-wise papers
for element in soup.find_all(["h2", "h3", "h4", "cite"]):
    if element.name in ["h2", "h3", "h4"]:  # Section headers
        current_section = element.text.strip()
    elif element.name == "cite":  # Paper entries
        paper_title = element.text.strip()
        papers.append([current_section, paper_title])

# %%
df = pd.DataFrame(papers, columns=["Section", "Paper Title"])
df.to_csv('AAAI_2024_Papers.csv', index=False)


