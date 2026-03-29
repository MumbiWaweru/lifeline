PY=python
PIP=$(PY) -m pip
UVICORN=uvicorn
APP=app.main:app
ENV?=.env
GREEN=\033[32m
BLUE=\033[34m
YELLOW=\033[33m
RESET=\033[0m

.PHONY: help install run dev fmt lint down

# Default target
help: ## Show available commands
	@printf "$(BLUE)[help]$(RESET) Available targets:\n"
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | awk 'BEGIN {FS = ": .*?## "}; {printf "  \033[33m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Create venv (if missing) and install requirements
	@printf "$(BLUE)[setup]$(RESET) Ensuring virtualenv...\n"
	@if [ ! -d .venv ]; then $(PY) -m venv .venv && printf "$(GREEN)[ok]$(RESET) venv created\n"; else printf "$(YELLOW)[skip]$(RESET) venv already exists\n"; fi
	@printf "$(BLUE)[setup]$(RESET) Upgrading pip...\n"
	@. .venv/bin/activate && $(PIP) install --upgrade pip >/dev/null
	@printf "$(BLUE)[setup]$(RESET) Installing requirements...\n"
	@. .venv/bin/activate && $(PIP) install -r requirements.txt
	@printf "$(GREEN)[done]$(RESET) Dependencies ready.\n"

up: ## Start API with uvicorn (reload)
	@printf "$(BLUE)[run]$(RESET) Starting API (reload)...\n"
	@. .venv/bin/activate && ENV_FILE=$(ENV) $(UVICORN) $(APP) --reload

dev: install run ## Install deps and start API

fmt: ## Format with black
	@. .venv/bin/activate && black app

lint: ## Run ruff lint checks
	@. .venv/bin/activate && ruff app

down: ## Stop uvicorn dev server (best-effort)
	@printf "$(BLUE)[down]$(RESET) Stopping uvicorn...\n"
	@pkill -f "uvicorn app.main:app --reload" >/dev/null 2>&1 || true
	@pkill -f "uvicorn app.main:app" >/dev/null 2>&1 || true
	@printf "$(GREEN)[done]$(RESET) Stopped (if running).\n"
