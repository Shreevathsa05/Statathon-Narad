export default function DynamicField({ field, value, onChange, language }) {
	switch (field.type) {
		case "mcq":
			return (
				<div className="space-y-4">
					<p className="font-medium text-[15px] text-text-primary">{field.text?.[language]}</p>

					<div className="space-y-2">
						{field.options.map((opt) => (
							<label
								key={opt.id}
								className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                  ${value === opt.id ? "border-geist-blue bg-geist-blue/10" : "border-border hover:bg-surface-alt"}
                `}
							>
								<input
									type="radio"
									name={field.qid}
									checked={value === opt.id}
									onChange={() => onChange(field.qid, opt.id)}
									className="accent-geist-blue"
								/>
								<span className="text-sm text-text-primary">{opt.label?.[language]}</span>
							</label>
						))}
					</div>
				</div>
			);

		case "text":
			return (
				<div className="space-y-3">
					<p className="font-medium text-[15px] text-text-primary">{field.text?.[language]}</p>
					<input
						type="text"
						className="w-full bg-bg border border-border text-text-primary rounded-md px-3 py-2 text-sm outline-none focus:border-geist-blue focus:ring-1 focus:ring-geist-blue/20 transition-all"
						value={value || ""}
						onChange={(e) => onChange(field.qid, e.target.value)}
					/>
				</div>
			);

		case "checkbox":
			return (
				<div className="space-y-4">
					<p className="font-medium text-[15px] text-text-primary">{field.text?.[language]}</p>

					<div className="space-y-2">
						{field.options.map((opt) => {
							const selectedValues = value || [];

							return (
								<label
									key={opt.id}
									className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                ${selectedValues.includes(opt.id) ? "border-geist-blue bg-geist-blue/10" : "border-border hover:bg-surface-alt"}
              `}
								>
									<input
										type="checkbox"
										checked={selectedValues.includes(opt.id)}
										onChange={(e) => {
											let updated = [...selectedValues];

											if (e.target.checked) {
												updated.push(opt.id);
											} else {
												updated = updated.filter((v) => v !== opt.id);
											}

											onChange(field.qid, updated);
										}}
										className="accent-geist-blue"
									/>

									<span className="text-sm text-text-primary">{opt.label?.[language]}</span>
								</label>
							);
						})}
					</div>
				</div>
			);
		default:
			return null;
	}
}
